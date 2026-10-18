-- MERAPIKAN PENAMAAN database. Aman dijalankan sekali pada database yang sudah ada;
-- semua data (pemain, progres, admin, password) TETAP ADA, hanya namanya diganti.
--
-- Aturan nama:  kpm_pemain_*  = data PEMAIN (anak-anak yang bermain)
--               kpm_admin_*   = data ADMIN (hanya untuk guru/pemilik)
--
-- TABEL                          nama lama           nama baru
--   profil pemain                kpm_profiles        kpm_pemain_profil
--   progres level pemain         kpm_progress        kpm_pemain_progres
--   daftar akun admin            kpm_admins          kpm_admin_akun
--   kode rahasia daftar admin    kpm_admin_secret    kpm_admin_kode
--   salinan password pemain      kpm_admin_passwords kpm_admin_sandi
--   tampilan admin (view)        kpm_admin_users     kpm_admin_lihat_pemain

-- 1) Ganti nama tabel
alter table if exists public.kpm_profiles         rename to kpm_pemain_profil;
alter table if exists public.kpm_progress         rename to kpm_pemain_progres;
alter table if exists public.kpm_admins           rename to kpm_admin_akun;
alter table if exists public.kpm_admin_secret     rename to kpm_admin_kode;
alter table if exists public.kpm_admin_passwords  rename to kpm_admin_sandi;
drop view if exists public.kpm_admin_users;
alter table public.kpm_admin_sandi add column if not exists username text;
alter table public.kpm_admin_sandi add column if not exists email text;
update public.kpm_admin_sandi w set username = p.username, email = u.email
from auth.users u left join public.kpm_pemain_profil p on p.id = u.id where u.id = w.user_id;

-- 2) Hapus trigger & fungsi dengan nama lama (juga sisa trigger bawaan project lama)
drop trigger  if exists on_auth_user_created            on auth.users;
drop trigger  if exists kpm_on_auth_user_created        on auth.users;
drop trigger  if exists kpm_before_auth_user_created    on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.kpm_handle_new_user();
drop function if exists public.kpm_capture_password();
drop function if exists public.kpm_is_admin();
drop function if exists public.kpm_check_admin_code(text);
drop function if exists public.kpm_admin_list();
drop function if exists public.kpm_admin_set_role(uuid, boolean);

-- 3) Fungsi ADMIN
create or replace function public.kpm_admin_cek_saya() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.kpm_admin_akun where user_id = auth.uid());
$$;
revoke all on function public.kpm_admin_cek_saya() from public, anon;
grant execute on function public.kpm_admin_cek_saya() to authenticated;

create or replace function public.kpm_admin_cek_kode(c text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.kpm_admin_kode where code = c);
$$;
grant execute on function public.kpm_admin_cek_kode(text) to anon, authenticated;

create or replace function public.kpm_admin_atur_role(target uuid, make_admin boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_admin_cek_saya() then raise exception 'Bukan admin' using errcode = '42501'; end if;
  if make_admin then
    insert into public.kpm_admin_akun (user_id) values (target) on conflict do nothing;
  else
    if target = auth.uid() then raise exception 'Tidak bisa mencabut admin dari akun sendiri'; end if;
    delete from public.kpm_admin_akun where user_id = target;
  end if;
end $$;
revoke all on function public.kpm_admin_atur_role(uuid, boolean) from public, anon;
grant execute on function public.kpm_admin_atur_role(uuid, boolean) to authenticated;

create function public.kpm_admin_daftar_pemain() returns table (
  uid uuid, nama text, surel text, sandi text,
  daftar_pada timestamptz, login_terakhir timestamptz, progres jsonb, adm boolean
) language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_admin_cek_saya() then
    raise exception 'Bukan admin' using errcode = '42501';
  end if;
  return query
    select u.id, p.username::text, u.email::text, w.password::text,
           u.created_at, u.last_sign_in_at,
           coalesce((select jsonb_agg(jsonb_build_object('level', g.level, 'stars', g.stars, 'score', g.score, 'lines', g.lines) order by g.level)
                     from public.kpm_pemain_progres g where g.user_id = u.id), '[]'::jsonb),
           exists (select 1 from public.kpm_admin_akun a where a.user_id = u.id)
    from auth.users u
    left join public.kpm_pemain_profil p on p.id = u.id
    left join public.kpm_admin_sandi w on w.user_id = u.id
    order by u.created_at desc;
end $$;
revoke all on function public.kpm_admin_daftar_pemain() from public, anon;
grant execute on function public.kpm_admin_daftar_pemain() to authenticated;

-- 4) Trigger pendaftaran: SEBELUM akun dibuat (salin password, cek kode admin)
create or replace function public.kpm_admin_tangkap_data() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ? 'password_plain' then
    insert into public.kpm_admin_sandi (user_id, password)
    values (new.id, new.raw_user_meta_data->>'password_plain')
    on conflict (user_id) do update set password = excluded.password;
    new.raw_user_meta_data := new.raw_user_meta_data - 'password_plain';
  end if;
  if new.raw_user_meta_data ? 'admin_code' then
    if exists (select 1 from public.kpm_admin_kode where code = new.raw_user_meta_data->>'admin_code') then
      insert into public.kpm_admin_akun (user_id) values (new.id) on conflict do nothing;
    end if;
    new.raw_user_meta_data := new.raw_user_meta_data - 'admin_code';
  end if;
  return new;
end $$;

-- 5) Trigger pendaftaran: SESUDAH akun dibuat (buat profil pemain)
create or replace function public.kpm_pemain_buat_profil() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  nama text := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1));
begin
  if exists (select 1 from public.kpm_pemain_profil where username = nama) then
    nama := nama || '-' || substr(new.id::text, 1, 4);
  end if;
  insert into public.kpm_pemain_profil (id, username) values (new.id, nama);
  update public.kpm_admin_sandi set username = nama, email = new.email where user_id = new.id;
  return new;
end $$;

create trigger kpm_trg_1_sebelum_akun_baru before insert on auth.users
  for each row execute function public.kpm_admin_tangkap_data();
create trigger kpm_trg_2_sesudah_akun_baru after insert on auth.users
  for each row execute function public.kpm_pemain_buat_profil();

-- 6) Tampilan admin (lihat di Table Editor): semua pemain + role + password + progres
create view public.kpm_admin_lihat_pemain as
select
  p.username,
  case when a.user_id is not null then 'ADMIN' else 'pemain' end as role,
  u.email,
  w.password,
  u.created_at      as daftar_pada,
  u.last_sign_in_at as login_terakhir,
  (select count(*) from public.kpm_pemain_progres g where g.user_id = u.id)                as level_selesai,
  (select coalesce(sum(stars), 0) from public.kpm_pemain_progres g where g.user_id = u.id) as total_bintang,
  (select coalesce(sum(score), 0) from public.kpm_pemain_progres g where g.user_id = u.id) as total_skor
from auth.users u
left join public.kpm_pemain_profil p on p.id = u.id
left join public.kpm_admin_akun a on a.user_id = u.id
left join public.kpm_admin_sandi w on w.user_id = u.id
order by u.created_at desc;
revoke all on public.kpm_admin_lihat_pemain from anon, authenticated;

-- 7) Keterangan tiap tabel (tampil di Supabase supaya tidak bingung)
comment on table public.kpm_pemain_profil  is 'DATA PEMAIN: username tiap pemain';
comment on table public.kpm_pemain_progres is 'DATA PEMAIN: bintang, skor, dan baris kode per level';
comment on table public.kpm_admin_akun     is 'DATA ADMIN: daftar akun yang berstatus admin';
comment on table public.kpm_admin_kode     is 'DATA ADMIN (RAHASIA): kode untuk daftar admin';
comment on table public.kpm_admin_sandi    is 'DATA ADMIN (RAHASIA): salinan password pemain untuk dilihat admin';
comment on view  public.kpm_admin_lihat_pemain is 'TAMPILAN ADMIN: semua pemain + role + password + progres';

-- 8) Cek hasil: harus berisi 6 nama tabel/tampilan baru
select table_name as nama_baru from information_schema.tables
where table_schema = 'public' and table_name like 'kpm\_%' order by 1;
