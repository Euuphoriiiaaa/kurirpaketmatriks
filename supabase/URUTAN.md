# Urutan menjalankan SQL (SQL Editor Supabase)

## Database BARU (kosong)
Jalankan berurutan, satu per satu:
1. `lama/schema.sql`
2. `lama/migration_level10.sql`
3. `lama/migration_admin_password.sql`
4. `lama/migration_admin_role.sql`
5. `lama/migration_admin_register.sql`  (di akhir muncul KODE ADMIN, catat)
6. `migration_rapikan_nama.sql`          (mengganti ke nama tabel yang rapi)

## Database yang SUDAH berjalan (punya tabel kpm_*)
Cukup jalankan `migration_rapikan_nama.sql` sekali, lalu pakai kode game terbaru.

## Penamaan
- `kpm_pemain_*` = data pemain
- `kpm_admin_*`  = data admin (rahasia)

## Fitur dashboard admin (jalankan berurutan, sekali saja)
7. `migration_admin_dashboard.sql`  (ubah/hapus pemain, progres, log aktivitas)
8. `migration_admin_tampilan.sql`   (background login/daftar/admin + foto profil)
