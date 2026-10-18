-- Jalankan sekali jika tabel progress sudah dibuat sebelumnya (batas level 1-3 -> 1-5).
alter table public.progress drop constraint if exists progress_level_check;
alter table public.progress add constraint progress_level_check check (level between 1 and 5);
