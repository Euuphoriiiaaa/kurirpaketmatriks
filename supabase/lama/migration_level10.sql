-- Jalankan sekali di Supabase (SQL Editor): batas level progress 1-5 -> 1-10.
alter table public.kpm_progress drop constraint if exists kpm_progress_level_check;
alter table public.kpm_progress drop constraint if exists progress_level_check;
alter table public.kpm_progress add constraint kpm_progress_level_check check (level between 1 and 10);
