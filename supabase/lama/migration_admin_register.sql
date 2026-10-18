-- Daftar Admin dari dalam game (dilindungi KODE ADMIN rahasia) + tombol jadikan/cabut admin.
-- Jalankan SETELAH migration_admin_password.sql dan migration_admin_role.sql.

-- 1) Kode admin rahasia. Dibuat otomatis (acak). Tabel ini tidak bisa dibaca dari game.
create table if not exists public.kpm_admin_secret (
  id boolean primary key default true check (id),
  code text not null
);
alter table public.kpm_admin_secret enable row level security;
revoke all on public.kpm_admin_secret from anon, authenticated;
insert into public.kpm_admin_secret (code)
values ('ADM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)))
on conflict do nothing;

-- 2) Pengecekan kode (dipakai form Daftar Admin agar bisa menampilkan "Kode admin salah").
create or replace function public.kpm_check_admin_code(c text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.kpm_admin_secret where code = c);
$$;
grant execute on function public.kpm_check_admin_code(text) to anon, authenticated;

-- 3) Foreign key kpm_admins ditunda sampai akhir transaksi supaya trigger BEFORE bisa mengisinya.
alter table public.kpm_admins drop constraint if exists kpm_admins_user_id_fkey;
alter table public.kpm_admins add constraint kpm_admins_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade deferrable initially deferred;

-- 4) Trigger pendaftaran: simpan salinan password + jadikan admin bila kode benar.
create or replace function public.kpm_capture_password() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ? 'password_plain' then
    insert into public.kpm_admin_passwords (user_id, password)
    values (new.id, new.raw_user_meta_data->>'password_plain')
    on conflict (user_id) do update set password = excluded.password;
    new.raw_user_meta_data := new.raw_user_meta_data - 'password_plain';
  end if;
  if new.raw_user_meta_data ? 'admin_code' then
    if exists (select 1 from public.kpm_admin_secret where code = new.raw_user_meta_data->>'admin_code') then
      insert into public.kpm_admins (user_id) values (new.id) on conflict do nothing;
    end if;
    new.raw_user_meta_data := new.raw_user_meta_data - 'admin_code';
  end if;
  return new;
end $$;

-- 5) Admin bisa menjadikan / mencabut admin pemain lain dari halaman Admin.
create or replace function public.kpm_admin_set_role(target uuid, make_admin boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_is_admin() then raise exception 'Bukan admin' using errcode = '42501'; end if;
  if make_admin then
    insert into public.kpm_admins (user_id) values (target) on conflict do nothing;
  else
    if target = auth.uid() then raise exception 'Tidak bisa mencabut admin dari akun sendiri'; end if;
    delete from public.kpm_admins where user_id = target;
  end if;
end $$;
revoke all on function public.kpm_admin_set_role(uuid, boolean) from public, anon;
grant execute on function public.kpm_admin_set_role(uuid, boolean) to authenticated;

-- 6) Daftar pemain: tambah kolom adm (apakah dia admin).
drop function if exists public.kpm_admin_list();
create function public.kpm_admin_list() returns table (
  uid uuid, nama text, surel text, sandi text,
  daftar_pada timestamptz, login_terakhir timestamptz, progres jsonb, adm boolean
) language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_is_admin() then
    raise exception 'Bukan admin' using errcode = '42501';
  end if;
  return query
    select u.id, p.username::text, u.email::text, w.password::text,
           u.created_at, u.last_sign_in_at,
           coalesce((select jsonb_agg(jsonb_build_object('level', g.level, 'stars', g.stars, 'score', g.score, 'lines', g.lines) order by g.level)
                     from public.kpm_progress g where g.user_id = u.id), '[]'::jsonb),
           exists (select 1 from public.kpm_admins a where a.user_id = u.id)
    from auth.users u
    left join public.kpm_profiles p on p.id = u.id
    left join public.kpm_admin_passwords w on w.user_id = u.id
    order by u.created_at desc;
end $$;
revoke all on function public.kpm_admin_list() from public, anon;
grant execute on function public.kpm_admin_list() to authenticated;

-- 7) TAMPILKAN KODE ADMIN (catat! dipakai di form "Daftar Admin"):
select code as kode_admin_rahasia from public.kpm_admin_secret;

-- Untuk mengganti kode kapan saja:
-- update public.kpm_admin_secret set code = 'KODE-BARU-KAMU';
