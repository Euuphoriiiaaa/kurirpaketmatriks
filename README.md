<div align="center">

# 🚚 Kurir Paket Matriks

**Game edukasi logika & dasar-dasar pemrograman — jadilah kurir, kendalikan truk dengan perintah teks!**

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e?logo=supabase&logoColor=white)

</div>

---

## 📖 Tentang Game

**Kurir Paket Matriks** adalah game edukasi yang melatih **berpikir logis, algoritma, dan dasar pemrograman** lewat cerita yang menyenangkan. Pemain berperan sebagai kurir yang harus **mengambil paket**, **menghindari titik macet**, lalu **menyerahkan paket** di tujuan akhir pada peta grid 6×6.

Truk tidak digerakkan dengan tombol arah, melainkan dengan **menulis perintah teks** — seperti menulis program sederhana. Semakin singkat dan efisien kodenya, semakin banyak bintang yang didapat. Bahasa dan tutorialnya dibuat sederhana sehingga mudah dipahami oleh siswa, termasuk anak SD.

## ✨ Fitur Utama

### Untuk Pemain
- 🗺️ **10 level bertingkat** dari *Pemula* hingga *Legenda*, dengan jumlah paket dan rintangan yang makin menantang.
- ⌨️ **Editor kode & konsol** dengan pesan kesalahan berbahasa Indonesia yang menunjukkan nomor baris.
- ⭐ **Sistem bintang & skor** berdasarkan efisiensi jumlah baris kode; level lanjut mewajibkan `ULANGI` (loop) untuk bintang 3.
- ⏱️ **Pewaktu** yang berjalan saat pemain mulai mengetik.
- 👩‍🏫 **Tutorial interaktif bersuara** dengan karakter "Kak Kurir".
- 🎨 **4 tema tampilan**: Logistik Klasik, Cyberpunk Neon, Pastel Soft, dan Dark Mode.
- 🎵 **Musik latar** (Lo-fi, Arcade, City) yang bisa dimatikan.
- 👤 **Akun pemain** dengan progres tersimpan di Supabase, atau **main sebagai tamu** tanpa akun.

### Untuk Admin
Dasbor admin layar penuh dengan navigasi tab (dan pintasan keyboard):

| Tab | Fungsi |
|-----|--------|
| **Ringkasan** | Gambaran umum game dan pemain |
| **Pemain** | Lihat, tambah, ubah, dan hapus data pemain |
| **Level** | Peta dan statistik tiap level |
| **Peringkat** | Papan peringkat kurir |
| **Tampilan** | Atur foto profil (unggah gambar atau pilih karakter kurir) dan background halaman login/daftar/admin |
| **Log & Pengaturan** | Riwayat aksi admin dan kode admin |

## 🎮 Cara Bermain

1. Truk mulai dari **depot** pada peta grid. Setiap kotak punya nama: **B** = baris, **K** = kolom (contoh: `B3-K4`).
2. Tulis perintah di editor, **satu perintah per baris**.
3. Ambil semua paket (A, B, C, …) **secara berurutan**, hindari titik macet, lalu `SERAH` di **Paket Selesai**.
4. Tekan tombol jalankan dan lihat truk mengikuti perintahmu.

### Daftar Perintah

| Perintah | Fungsi |
|----------|--------|
| `MAJU` | Truk jalan ke depan |
| `MUNDUR` | Truk jalan ke belakang |
| `BELOK KANAN` / `BELOK KIRI` | Memutar arah truk |
| `BALIK ARAH` | Memutar balik 180° |
| `AMBIL` | Mengambil paket di kotak saat ini |
| `SERAH` | Menyerahkan paket di tujuan |
| `ULANGI n { ... }` | Mengulang perintah di dalam kurung `n` kali (1–20) |
| `# teks` | Komentar (diabaikan) |

**Contoh program:**

```text
# Maju 3 kotak lalu belok kanan
ULANGI 3 {
  MAJU
}
BELOK KANAN
MAJU
AMBIL
```

> Perintah berbahasa Inggris juga didukung: `LEFT`, `RIGHT`, `UTURN`, `PICKUP`, `DELIVER`, `REPEAT`.

## 🛠️ Teknologi

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** untuk gaya tampilan
- **Zustand** untuk manajemen state
- **Framer Motion** untuk animasi
- **Lucide React** untuk ikon
- **Supabase** (PostgreSQL) sebagai database dan autentikasi pemain/admin

## 🚀 Menjalankan di Komputer Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) 18 atau lebih baru
- Akun [Supabase](https://supabase.com/) (gratis) — opsional jika hanya ingin mencoba sebagai tamu

### Langkah-langkah

```bash
# 1. Clone repositori
git clone https://github.com/MRikoKuswoyo/maganghub-kurirpaketmatriks.git
cd maganghub-kurirpaketmatriks

# 2. Pasang dependensi
npm install

# 3. Siapkan environment
cp .env.example .env.local      # Windows: copy .env.example .env.local
# lalu isi dua nilai berikut dari Supabase → Project Settings → API:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Jalankan
npm run dev
```

Buka **http://localhost:3000** di browser.

> Tanpa file `.env.local`, game tetap bisa dimainkan sebagai **tamu** (progres tidak tersimpan di database).

## 🗄️ Menyiapkan Database Supabase

1. Buat project baru di Supabase.
2. Buka **SQL Editor**, lalu jalankan file SQL di folder [`supabase/`](./supabase) **secara berurutan** sesuai panduan di [`supabase/URUTAN.md`](./supabase/URUTAN.md).
3. Pada langkah `migration_admin_register.sql`, **catat KODE ADMIN** yang muncul di akhir hasil — kode ini dipakai untuk mendaftar sebagai admin.
4. Jalankan `migration_admin_dashboard.sql` dan `migration_admin_tampilan.sql` untuk mengaktifkan fitur dasbor admin.

Penamaan tabel: `kpm_pemain_*` untuk data pemain dan `kpm_admin_*` untuk data admin (rahasia).

## 📁 Struktur Proyek

```text
├── public/audio/          # Rekaman suara tutorial
├── src/
│   ├── app/               # Halaman & layout Next.js
│   ├── components/        # Komponen game (Grid, Editor, Konsol, dll.)
│   │   └── admin/         # Komponen dasbor admin
│   ├── lib/               # Parser perintah, engine game, level, API Supabase
│   └── store/             # State global (game, auth, pengaturan)
└── supabase/              # Skema & migrasi SQL database
```

## 🔐 Keamanan

- **Jangan** meng-commit file `.env.local` (sudah masuk `.gitignore`).
- Gunakan hanya **anon key** di sisi klien; jangan pernah menaruh `service_role` key di kode.
- Pastikan **Row Level Security (RLS)** aktif pada tabel di Supabase.
- Jaga kerahasiaan **kode admin**.

## 📜 Hak Cipta & Lisensi

**Hak Cipta © 2026 Team MagangHub BBGTK Provinsi Sumatera Utara — Divisi Pranata Komputer dan Digital. Seluruh hak dilindungi undang-undang.**

Perangkat lunak ini beserta seluruh kode sumber, desain antarmuka, level, narasi, aset audio, dan dokumentasinya dilindungi oleh Undang-Undang Nomor 28 Tahun 2014 tentang Hak Cipta. Dilarang menyalin, memperbanyak, memodifikasi, mendistribusikan, atau menggunakan seluruh maupun sebagian karya ini untuk tujuan apa pun tanpa izin tertulis dari pemegang hak cipta. Penggunaan untuk keperluan pembelajaran di lingkungan BBGTK Provinsi Sumatera Utara diperbolehkan sesuai ketentuan pada berkas [LICENSE](./LICENSE).

Untuk permohonan izin penggunaan, silakan hubungi Team MagangHub BBGTK Provinsi Sumatera Utara.

---

<div align="center">

**Dibuat oleh Team MagangHub BBGTK Prov Sumatera Utara Div Pranata Komputer dan Digital**

</div>
