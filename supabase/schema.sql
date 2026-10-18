create table public.kpm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);
create table public.kpm_progress (
  user_id uuid references auth.users(id) on delete cascade,
  level int not null check (level between 1 and 10),
  stars int not null check (stars between 1 and 3),
  score int not null,
  lines int not null,
  updated_at timestamptz default now(),
  primary key (user_id, level)
);
alter table public.kpm_profiles enable row level security;
alter table public.kpm_progress enable row level security;
create policy "profil: baca milik sendiri" on public.kpm_profiles for select using (auth.uid() = id);
create policy "profil: ubah milik sendiri" on public.kpm_profiles for update using (auth.uid() = id);
create policy "progres: baca milik sendiri" on public.kpm_progress for select using (auth.uid() = user_id);
create policy "progres: tulis milik sendiri" on public.kpm_progress for insert with check (auth.uid() = user_id);
create policy "progres: ubah milik sendiri" on public.kpm_progress for update using (auth.uid() = user_id);

create function public.kpm_handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.kpm_profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger kpm_on_auth_user_created after insert on auth.users
  for each row execute function public.kpm_handle_new_user();