import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { LEVELS } from './levels';

export interface Prog { level: number; stars: number; score: number; lines: number; updated?: string }
export interface Row {
  uid: string; nama: string | null; surel: string | null; sandi: string | null;
  daftar_pada: string; login_terakhir: string | null; progres: Prog[]; adm: boolean; foto?: string | null;
}
export interface LogRow { id: number; waktu: string; admin_nama: string | null; aksi: string; target_nama: string | null; detail: string | null }

const db = () => { if (!supabase) throw new Error('Supabase belum dikonfigurasi.'); return supabase; };
const pesan = (e: { message: string; code?: string }) =>
  e.code === '42501' ? 'Akun ini bukan admin.'
  : /Could not find|does not exist/.test(e.message) ? 'Fungsi database belum ada. Jalankan file migrasi SQL terbaru di SQL Editor Supabase.'
  : e.message;
const run = async (p: PromiseLike<{ error: { message: string; code?: string } | null }>) => {
  const { error } = await p;
  if (error) throw new Error(pesan(error));
};

export async function fetchPemain(): Promise<Row[]> {
  const { data, error } = await db().rpc('kpm_admin_daftar_pemain');
  if (error) throw new Error(error.code === '42501' ? 'Akun ini bukan admin.' : error.message);
  return (data as Row[]) ?? [];
}
export async function fetchLog(): Promise<LogRow[]> {
  const { data, error } = await db().rpc('kpm_admin_baca_log', { batas: 150 });
  if (error) throw new Error(error.message.includes('does not exist') ? 'Jalankan supabase/migration_admin_dashboard.sql dulu.' : error.message);
  return (data as LogRow[]) ?? [];
}
export const ubahPemain = (target: string, p: { nama?: string; surel?: string; sandi?: string }) =>
  run(db().rpc('kpm_admin_ubah_pemain', { target, nama_baru: p.nama || null, surel_baru: p.surel || null, sandi_baru: p.sandi || null }));
export const hapusPemain = (target: string) => run(db().rpc('kpm_admin_hapus_pemain', { target }));
export const setProgres = (target: string, lv: number, bintang: number, skor: number, baris: number) =>
  run(db().rpc('kpm_admin_set_progres', { target, lv, bintang, skor, baris }));
export const resetProgres = (target: string, lv: number | null) => run(db().rpc('kpm_admin_reset_progres', { target, lv }));
export const aturRole = (target: string, make_admin: boolean) => run(db().rpc('kpm_admin_atur_role', { target, make_admin }));
export const setPengaturan = (k: string, v: string | null) => run(db().rpc('kpm_admin_set_pengaturan', { k, v }));
export async function simpanFoto(uid: string, foto: string | null) {
  const { data, error } = await db().from('kpm_pemain_profil').update({ foto }).eq('id', uid).select('id');
  if (error) throw new Error(/kpm_foto_len/.test(error.message) ? 'Gambar terlalu besar.' : /foto/.test(error.message) ? 'Kolom foto belum ada. Jalankan supabase/migration_admin_tampilan.sql.' : error.message);
  if (!data?.length) throw new Error('Foto tidak tersimpan (izin ditolak).');
}
export const gantiKode = (kode_baru: string) => run(db().rpc('kpm_admin_ganti_kode', { kode_baru }));

/** Tambah pemain: pakai klien terpisah (tanpa sesi) agar admin tidak ikut logout. */
export async function tambahPemain(p: { nama: string; surel: string; sandi: string; admin: boolean }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const tmp = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await tmp.auth.signUp({ email: p.surel, password: p.sandi, options: { data: { username: p.nama, password_plain: p.sandi } } });
  if (error) throw new Error(error.message);
  const id = data.user?.id;
  if (p.admin && id) await aturRole(id, true);
}

/* ---------- Statistik khusus game ---------- */
const MAX_BINTANG = LEVELS.length * 3;
export const sum = (r: Row, f: 'stars' | 'score' | 'lines') => r.progres.reduce((a, p) => a + p[f], 0);
export const terakhirMain = (r: Row) => r.progres.reduce<string | null>((a, p) => (p.updated && (!a || p.updated > a) ? p.updated : a), null);
export const persenSelesai = (r: Row) => Math.round((r.progres.length / LEVELS.length) * 100);
export const persenBintang = (r: Row) => Math.round((sum(r, 'stars') / MAX_BINTANG) * 100);
export const levelTerbuka = (r: Row) => Math.min(LEVELS.length, (r.progres.length ? Math.max(...r.progres.map((p) => p.level)) : 0) + 1);

export interface LevelStat { id: number; judul: string; selesai: number; persen: number; rataBintang: number; rataSkor: number; rataBaris: number; bintang3: number; dist: [number, number, number] }
export function statLevel(rows: Row[]): LevelStat[] {
  const pemain = rows.filter((r) => !r.adm).length || rows.length || 1;
  return LEVELS.map((l) => {
    const ps = rows.flatMap((r) => r.progres.filter((p) => p.level === l.id));
    const n = ps.length, avg = (f: 'stars' | 'score' | 'lines') => (n ? ps.reduce((a, p) => a + p[f], 0) / n : 0);
    const dist: [number, number, number] = [1, 2, 3].map((s) => ps.filter((p) => p.stars === s).length) as [number, number, number];
    return { id: l.id, judul: l.title.split(': ')[1] ?? l.title, selesai: n, persen: Math.round((n / pemain) * 100), rataBintang: avg('stars'), rataSkor: avg('score'), rataBaris: avg('lines'), bintang3: dist[2], dist };
  });
}

export const tgl = (s: string | null | undefined) => (s ? new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
export const sejak = (s: string | null | undefined) => {
  if (!s) return 'belum pernah';
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return 'baru saja'; if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24); return d < 30 ? `${d} hari lalu` : tgl(s);
};
export function unduhCsv(rows: Row[], sandi: boolean) {
  const head = ['username', 'email', ...(sandi ? ['password'] : []), 'role', 'level_selesai', 'bintang', 'skor', 'total_baris', 'daftar', 'login_terakhir'];
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [r.nama, r.surel, ...(sandi ? [r.sandi] : []), r.adm ? 'admin' : 'pemain', r.progres.length, sum(r, 'stars'), sum(r, 'score'), sum(r, 'lines'), r.daftar_pada, r.login_terakhir].map(q).join(','));
  const blob = new Blob(['\ufeff' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pemain-kurir-matriks-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
}
