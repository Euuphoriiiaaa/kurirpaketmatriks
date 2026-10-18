-- TAMPILAN: background halaman login/daftar/login-admin + foto profil.
-- Jalankan SETELAH migration_admin_dashboard.sql. Aman dijalankan ulang.

-- 1) Foto profil (data URL gambar kecil, atau "karakter:<id>" untuk karakter bawaan)
alter table public.kpm_pemain_profil add column if not exists foto text;
alter table public.kpm_pemain_profil drop constraint if exists kpm_foto_len;
alter table public.kpm_pemain_profil add constraint kpm_foto_len check (foto is null or length(foto) <= 200000);

-- 2) Pengaturan tampilan. Tabel tertutup; dibaca lewat fungsi di bawah.
create table if not exists public.kpm_pengaturan (
  kunci text primary key,
  nilai text,
  diubah_pada timestamptz default now()
);
alter table public.kpm_pengaturan enable row level security;
revoke all on public.kpm_pengaturan from anon, authenticated;
comment on table public.kpm_pengaturan is 'DATA ADMIN: pengaturan tampilan (background halaman login, dll)';

-- 3) Publik (halaman login belum punya sesi): hanya kunci background yang boleh dibaca
create or replace function public.kpm_publik_ambil(k text) returns text
language sql security definer stable set search_path = public as $$
  select nilai from public.kpm_pengaturan where kunci = k and k in ('bg_login', 'bg_register', 'bg_admin');
$$;
revoke all on function public.kpm_publik_ambil(text) from public;
grant execute on function public.kpm_publik_ambil(text) to anon, authenticated;

-- 4) Admin mengubah / menghapus background (v kosong = hapus)
create or replace function public.kpm_admin_set_pengaturan(k text, v text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_admin_cek_saya() then raise exception 'Bukan admin' using errcode = '42501'; end if;
  if k not in ('bg_login', 'bg_register', 'bg_admin') then raise exception 'Kunci pengaturan tidak dikenal'; end if;
  if v is null or length(trim(v)) = 0 then
    delete from public.kpm_pengaturan where kunci = k;
  else
    if length(v) > 900000 then raise exception 'Gambar terlalu besar (maks sekitar 650 KB)'; end if;
    if v !~ '^(data:image/|https?://)' then raise exception 'Format gambar tidak valid'; end if;
    insert into public.kpm_pengaturan (kunci, nilai, diubah_pada) values (k, v, now())
      on conflict (kunci) do update set nilai = excluded.nilai, diubah_pada = now();
  end if;
  perform public.kpm_admin_catat('set_pengaturan', null, k || case when v is null or length(trim(v)) = 0 then ' (dihapus)' else '' end);
end $$;
revoke all on function public.kpm_admin_set_pengaturan(text, text) from public, anon;
grant execute on function public.kpm_admin_set_pengaturan(text, text) to authenticated;

-- 5) Daftar pemain: tambah kolom foto
drop function if exists public.kpm_admin_daftar_pemain();
create function public.kpm_admin_daftar_pemain() returns table (
  uid uuid, nama text, surel text, sandi text,
  daftar_pada timestamptz, login_terakhir timestamptz, progres jsonb, adm boolean, foto text
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
           exists (select 1 from public.kpm_admin_akun a where a.user_id = u.id),
           p.foto::text
    from auth.users u
    left join public.kpm_pemain_profil p on p.id = u.id
    left join public.kpm_admin_sandi w on w.user_id = u.id
    order by u.created_at desc;
end $$;
revoke all on function public.kpm_admin_daftar_pemain() from public, anon;
grant execute on function public.kpm_admin_daftar_pemain() to authenticated;
