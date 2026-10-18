-- Menyimpan salinan password agar admin bisa melihatnya di dashboard Supabase.
-- PERINGATAN: password asli tersimpan sebagai teks biasa. Jalankan hanya jika memang perlu.

-- 1) Tabel rahasia: RLS aktif tanpa policy + semua akses anon/authenticated dicabut,
--    jadi hanya bisa dibaca lewat dashboard Supabase (SQL Editor / Table Editor).
create table if not exists public.kpm_admin_passwords (
  user_id uuid primary key,
  password text,
  created_at timestamptz default now()
);
alter table public.kpm_admin_passwords enable row level security;
revoke all on public.kpm_admin_passwords from anon, authenticated;

-- 2) Trigger BEFORE INSERT: ambil password dari metadata lalu BUANG dari metadata,
--    sehingga tidak ikut tersimpan di auth.users maupun terkirim balik ke browser.
create or replace function public.kpm_capture_password() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ? 'password_plain' then
    insert into public.kpm_admin_passwords (user_id, password)
    values (new.id, new.raw_user_meta_data->>'password_plain')
    on conflict (user_id) do update set password = excluded.password;
    new.raw_user_meta_data := new.raw_user_meta_data - 'password_plain';
  end if;
  return new;
end $$;

drop trigger if exists kpm_before_auth_user_created on auth.users;
create trigger kpm_before_auth_user_created before insert on auth.users
  for each row execute function public.kpm_capture_password();

-- 3) Tampilan admin: username, email, password, progres.
drop view if exists public.kpm_admin_users;
create view public.kpm_admin_users as
select
  p.username,
  u.email,
  w.password,
  u.created_at      as daftar_pada,
  u.last_sign_in_at as login_terakhir,
  (select count(*) from public.kpm_progress g where g.user_id = u.id)                as level_selesai,
  (select coalesce(sum(stars), 0) from public.kpm_progress g where g.user_id = u.id) as total_bintang,
  (select coalesce(sum(score), 0) from public.kpm_progress g where g.user_id = u.id) as total_skor
from auth.users u
left join public.kpm_profiles p on p.id = u.id
left join public.kpm_admin_passwords w on w.user_id = u.id
order by u.created_at desc;
revoke all on public.kpm_admin_users from anon, authenticated;
