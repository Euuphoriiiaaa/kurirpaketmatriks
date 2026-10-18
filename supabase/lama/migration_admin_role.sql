-- Role admin + fungsi daftar pemain untuk halaman Admin di dalam game.
-- Jalankan SETELAH schema.sql dan migration_admin_password.sql.

-- 1) Tabel role admin. Tidak bisa diakses dari game; diatur lewat SQL Editor Supabase.
create table if not exists public.kpm_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.kpm_admins enable row level security;
revoke all on public.kpm_admins from anon, authenticated;

-- 2) Cek apakah user yang sedang login adalah admin.
create or replace function public.kpm_is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.kpm_admins where user_id = auth.uid());
$$;
revoke all on function public.kpm_is_admin() from public, anon;
grant execute on function public.kpm_is_admin() to authenticated;

-- 3) Daftar semua pemain + password + progres. Menolak siapa pun yang bukan admin.
create or replace function public.kpm_admin_list() returns table (
  uid uuid, nama text, surel text, sandi text,
  daftar_pada timestamptz, login_terakhir timestamptz, progres jsonb
) language plpgsql security definer set search_path = public as $$
begin
  if not public.kpm_is_admin() then
    raise exception 'Bukan admin' using errcode = '42501';
  end if;
  return query
    select u.id, p.username::text, u.email::text, w.password::text,
           u.created_at, u.last_sign_in_at,
           coalesce((select jsonb_agg(jsonb_build_object('level', g.level, 'stars', g.stars, 'score', g.score, 'lines', g.lines) order by g.level)
                     from public.kpm_progress g where g.user_id = u.id), '[]'::jsonb)
    from auth.users u
    left join public.kpm_profiles p on p.id = u.id
    left join public.kpm_admin_passwords w on w.user_id = u.id
    order by u.created_at desc;
end $$;
revoke all on function public.kpm_admin_list() from public, anon;
grant execute on function public.kpm_admin_list() to authenticated;

-- 4) JADIKAN AKUN KAMU ADMIN: ganti email di bawah dengan email akun game milikmu,
--    lalu jalankan baris ini sekali saja (hapus tanda -- di depannya).
-- insert into public.kpm_admins (user_id) select id from auth.users where email = 'EMAIL-KAMU@gmail.com' on conflict do nothing;
