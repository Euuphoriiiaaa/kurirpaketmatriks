-- DASHBOARD ADMIN: aksi ubah / hapus / reset progres + log aktivitas.
-- Jalankan SETELAH migration_rapikan_nama.sql. Aman dijalankan ulang.
-- Semua fungsi menolak akun yang bukan admin (errcode 42501).

create extension if not exists pgcrypto with schema extensions;

-- 1) Log aktivitas admin (hanya terbaca lewat fungsi admin)
create table if not exists public.kpm_admin_log (
  id bigserial primary key,
  waktu timestamptz default now(),
  admin_id uuid,
  admin_nama text,
  aksi text not null,
  target_id uuid,
  target_nama text,
  detail text
);
alter table public.kpm_admin_log enable row level security;
revoke all on public.kpm_admin_log from anon, authenticated;
comment on table public.kpm_admin_log is 'DATA ADMIN: riwayat aksi admin di dashboard';

create or replace function public.kpm_admin_catat(aksi text, target uuid, detail text default null) returns void
language plpgsql security definer set search_path = public as $$
declare an text; tn text;
begin
  select username into an from public.kpm_pemain_profil where id = auth.uid();
  select username into tn from public.kpm_pemain_profil where id = target;
  insert into public.kpm_admin_log (admin_id, admin_nama, aksi, target_id, target_nama, detail)
  values (auth.uid(), an, aksi, target, tn, detail);
end $$;
revoke all on function public.kpm_admin_catat(text, uuid, text) from public, anon, authenticated;

-- 2) Daftar pemain (tambah updated_at pada progres untuk "aktivitas terakhir")
create or replace function public.kpm_admin_daftar_pemain() returns table (
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
           coalesce((select jsonb_agg(jsonb_build_object('level', g.level, 'stars', g.stars, 'score', g.score, 'lines', g.lines, 'updated', g.updated_at) order by g.level)
                     from public.kpm_pemain_progres g where g.user_id = u.id), '[]'::jsonb),
           exists (select 1 from public.kpm_admin_akun a where a.user_id = u.id)
    from auth.users u
    left join public.kpm_pemain_profil p on p.id = u.id
    left join public.kpm_admin_sandi w on w.user_id = u.id
    order by u.created_at desc;
end $$;
revoke all on function public.kpm_admin_daftar_pemain() from public, anon;
grant execute on function public.kpm_admin_daftar_pemain() to authenticated;

-- 3) Ubah data pemain (username / email / password). Parameter null = tidak diubah.
create or replace function public.kpm_admin_ubah_pemain(target uuid, nama_baru text default null, surel_baru text default null, sandi_baru text default null) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.kpm_admin_cek_saya() then raise exception 'Bukan admin' using errcode = '42501'; end if;
  if not exists (select 1 from auth.users where id = target) then raise exception 'Pemain tidak ditemukan'; end if;

  if nama_baru is not null and length(trim(nama_baru)) > 0 then
    if exists (select 1 from public.kpm_pemain_profil where username = trim(nama_baru) and id <> target) then
      raise exception 'Username sudah dipakai';
    end if;
    update public.kpm_pemain_profil set username = trim(nama_baru) where id = target;
    update public.kpm_admin_sandi set username = trim(nama_baru) where user_id = target;
  end if;

  if surel_baru is not null and length(trim(surel_baru)) > 0 then
    if exists (select 1 from auth.users where lower(email) = lower(trim(surel_baru)) and id <> target) then
      raise exception 'Email sudah dipakai';
    end if;
    update auth.users set email = lower(trim(surel_baru)), updated_at = now() where id = target;
    update auth.identities set identity_data = identity_data || jsonb_build_object('email', lower(trim(surel_baru)))
      where user_id = target and provider = 'email';
    update public.kpm_admin_sandi set email = lower(trim(surel_baru)) where user_id = target;
  end if;

  if sandi_baru is not null and length(sandi_baru) > 0 then
    if length(sandi_baru) < 6 then raise exception 'Password minimal 6 karakter'; end if;
    update auth.users set encrypted_password = extensions.crypt(sandi_baru, extensions.gen_salt('bf')), updated_at = now() where id = target;
    insert into public.kpm_admin_sandi (user_id, password) values (target, sandi_baru)
      on conflict (user_id) do update set password = excluded.password;
  end if;

  perform public.kpm_admin_catat('ubah_pemain', target,
    concat_ws(', ', case when nama_baru is not null then 'username' end,
                    case when surel_baru is not null then 'email' end,
                    case when sandi_baru is not null then 'password' end));
end $$;
revoke all on function public.kpm_admin_ubah_pemain(uuid, text, text, text) from public, anon;
grant execute on function public.kpm_admin_ubah_pemain(uuid, text, text, text) to authenticated;

-- 4) Hapus pemain beserta seluruh datanya (tidak bisa menghapus akun sendiri)
create or replace function public.kpm_admin_hapus_pemain(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_admin_cek_saya() then raise exception 'Bukan admin' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'Tidak bisa menghapus akun sendiri'; end if;
  perform public.kpm_admin_catat('hapus_pemain', target, null);
  delete from public.kpm_admin_sandi where user_id = target;
  delete from public.kpm_admin_akun where user_id = target;
  delete from auth.users where id = target;
end $$;
revoke all on function public.kpm_admin_hapus_pemain(uuid) from public, anon;
grant execute on function public.kpm_admin_hapus_pemain(uuid) to authenticated;

-- 5) Tambah / ubah progres satu level (bintang 1-3, skor, jumlah baris)
create or replace function public.kpm_admin_set_progres(target uuid, lv int, bintang int, skor int, baris int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_admin_cek_saya() then raise exception 'Bukan admin' using errcode = '42501'; end if;
  if lv not between 1 and 10 then raise exception 'Level harus 1-10'; end if;
  if bintang not between 1 and 3 then raise exception 'Bintang harus 1-3'; end if;
  insert into public.kpm_pemain_progres (user_id, level, stars, score, lines, updated_at)
  values (target, lv, bintang, greatest(skor, 0), greatest(baris, 0), now())
  on conflict (user_id, level) do update
    set stars = excluded.stars, score = excluded.score, lines = excluded.lines, updated_at = now();
  perform public.kpm_admin_catat('set_progres', target, 'level ' || lv || ': ' || bintang || '⭐ skor ' || skor);
end $$;
revoke all on function public.kpm_admin_set_progres(uuid, int, int, int, int) from public, anon;
grant execute on function public.kpm_admin_set_progres(uuid, int, int, int, int) to authenticated;

-- 6) Reset progres: lv diisi = satu level, lv null = semua level pemain
create or replace function public.kpm_admin_reset_progres(target uuid, lv int default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_admin_cek_saya() then raise exception 'Bukan admin' using errcode = '42501'; end if;
  delete from public.kpm_pemain_progres where user_id = target and (lv is null or level = lv);
  perform public.kpm_admin_catat('reset_progres', target, coalesce('level ' || lv, 'semua level'));
end $$;
revoke all on function public.kpm_admin_reset_progres(uuid, int) from public, anon;
grant execute on function public.kpm_admin_reset_progres(uuid, int) to authenticated;

-- 7) Baca log aktivitas admin
create or replace function public.kpm_admin_baca_log(batas int default 100) returns setof public.kpm_admin_log
language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_admin_cek_saya() then raise exception 'Bukan admin' using errcode = '42501'; end if;
  return query select * from public.kpm_admin_log order by waktu desc limit greatest(batas, 1);
end $$;
revoke all on function public.kpm_admin_baca_log(int) from public, anon;
grant execute on function public.kpm_admin_baca_log(int) to authenticated;

-- 8) Ganti kode rahasia pendaftaran admin dari dashboard
create or replace function public.kpm_admin_ganti_kode(kode_baru text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_admin_cek_saya() then raise exception 'Bukan admin' using errcode = '42501'; end if;
  if length(trim(kode_baru)) < 6 then raise exception 'Kode minimal 6 karakter'; end if;
  update public.kpm_admin_kode set code = trim(kode_baru);
  perform public.kpm_admin_catat('ganti_kode_admin', null, null);
end $$;
revoke all on function public.kpm_admin_ganti_kode(text) from public, anon;
grant execute on function public.kpm_admin_ganti_kode(text) to authenticated;

-- Catatan: peran admin (jadikan/cabut) tetap lewat kpm_admin_atur_role yang sudah ada.

-- 9) Jadikan/cabut admin sekarang ikut tercatat di log
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
  perform public.kpm_admin_catat(case when make_admin then 'jadikan_admin' else 'cabut_admin' end, target, null);
end $$;
revoke all on function public.kpm_admin_atur_role(uuid, boolean) from public, anon;
grant execute on function public.kpm_admin_atur_role(uuid, boolean) to authenticated;
