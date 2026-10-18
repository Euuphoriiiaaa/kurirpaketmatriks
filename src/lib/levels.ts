import { Level } from './types';

// Arena 6×6 (K1–K6, B1–B6). Level 1–5: 5 rintangan, level 6–10: 7 rintangan (letak diacak).
// Setiap level punya minimal 2 jalur terpendek menuju Paket Selesai.
const RAW: Level[] = [
  {
    id: 1, title: 'Pemula: Rute Dasar', size: 6,
    goal: 'Ambil 1 paket (A) berurutan, hindari 5 titik macet, lalu SERAH di Paket Selesai.',
    start: { r: 0, c: 0 }, finish: { r: 5, c: 5 },
    packages: [{ id: 'A', r: 2, c: 1 }],
    jams: [{ r: 2, c: 4 }, { r: 3, c: 4 }, { r: 2, c: 2 }, { r: 3, c: 2 }, { r: 4, c: 3 }],
    maxLines: 20,
    stars: { three: 11, two: 15, needLoopForThree: false },
  },
  {
    id: 2, title: 'Menengah: Multi-Target', size: 6,
    goal: 'Ambil 2 paket (A–B) berurutan, hindari 5 titik macet, lalu SERAH di Paket Selesai.',
    start: { r: 0, c: 0 }, finish: { r: 5, c: 5 },
    packages: [{ id: 'A', r: 3, c: 5 }, { id: 'B', r: 2, c: 3 }],
    jams: [{ r: 2, c: 1 }, { r: 4, c: 2 }, { r: 3, c: 2 }, { r: 5, c: 0 }, { r: 5, c: 1 }],
    maxLines: 26,
    stars: { three: 17, two: 21, needLoopForThree: false },
  },
  {
    id: 3, title: 'Mahir: Efisiensi Loop', size: 6,
    goal: 'Ambil 3 paket (A–C) berurutan, hindari 5 titik macet, lalu SERAH di Paket Selesai. Bintang 3 wajib memakai ULANGI.',
    start: { r: 0, c: 0 }, finish: { r: 5, c: 5 },
    packages: [{ id: 'A', r: 1, c: 0 }, { id: 'B', r: 3, c: 5 }, { id: 'C', r: 4, c: 3 }],
    jams: [{ r: 2, c: 4 }, { r: 3, c: 4 }, { r: 1, c: 5 }, { r: 5, c: 3 }, { r: 3, c: 3 }],
    maxLines: 31,
    stars: { three: 22, two: 26, needLoopForThree: true },
  },
  {
    id: 4, title: 'Ahli: Empat Paket', size: 6,
    goal: 'Ambil 4 paket (A–D) berurutan, hindari 5 titik macet, lalu SERAH di Paket Selesai. Bintang 3 wajib memakai ULANGI.',
    start: { r: 5, c: 0 }, finish: { r: 0, c: 5 },
    packages: [{ id: 'A', r: 5, c: 1 }, { id: 'B', r: 3, c: 3 }, { id: 'C', r: 4, c: 3 }, { id: 'D', r: 1, c: 2 }],
    jams: [{ r: 2, c: 3 }, { r: 5, c: 5 }, { r: 1, c: 5 }, { r: 1, c: 1 }, { r: 2, c: 5 }],
    maxLines: 30,
    stars: { three: 21, two: 25, needLoopForThree: true },
  },
  {
    id: 5, title: 'Master: Lima Paket', size: 6,
    goal: 'Ambil 5 paket (A–E) berurutan, hindari 5 titik macet, lalu SERAH di Paket Selesai. Bintang 3 wajib memakai ULANGI.',
    start: { r: 0, c: 0 }, finish: { r: 5, c: 5 },
    packages: [{ id: 'A', r: 4, c: 1 }, { id: 'B', r: 3, c: 3 }, { id: 'C', r: 5, c: 3 }, { id: 'D', r: 2, c: 3 }, { id: 'E', r: 3, c: 2 }],
    jams: [{ r: 5, c: 2 }, { r: 0, c: 4 }, { r: 5, c: 1 }, { r: 2, c: 5 }, { r: 1, c: 5 }],
    maxLines: 37,
    stars: { three: 28, two: 32, needLoopForThree: true },
  },
  {
    id: 6, title: 'Penjelajah: Tiga Paket', size: 6,
    goal: 'Ambil 3 paket (A–C) berurutan, hindari 7 titik macet, lalu SERAH di Paket Selesai. Bintang 3 wajib memakai ULANGI.',
    start: { r: 0, c: 0 }, finish: { r: 5, c: 5 },
    packages: [{ id: 'A', r: 0, c: 1 }, { id: 'B', r: 2, c: 0 }, { id: 'C', r: 1, c: 3 }],
    jams: [{ r: 1, c: 1 }, { r: 2, c: 4 }, { r: 1, c: 4 }, { r: 1, c: 0 }, { r: 3, c: 2 }, { r: 5, c: 2 }, { r: 4, c: 5 }],
    maxLines: 30,
    stars: { three: 21, two: 25, needLoopForThree: true },
  },
  {
    id: 7, title: 'Navigator: Jalan Berliku', size: 6,
    goal: 'Ambil 4 paket (A–D) berurutan, hindari 7 titik macet, lalu SERAH di Paket Selesai. Bintang 3 wajib memakai ULANGI.',
    start: { r: 0, c: 5 }, finish: { r: 5, c: 0 },
    packages: [{ id: 'A', r: 4, c: 3 }, { id: 'B', r: 2, c: 5 }, { id: 'C', r: 3, c: 5 }, { id: 'D', r: 5, c: 5 }],
    jams: [{ r: 5, c: 2 }, { r: 1, c: 0 }, { r: 0, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 3 }, { r: 5, c: 4 }, { r: 4, c: 2 }],
    maxLines: 34,
    stars: { three: 25, two: 29, needLoopForThree: true },
  },
  {
    id: 8, title: 'Pro: Lima Paket', size: 6,
    goal: 'Ambil 5 paket (A–E) berurutan, hindari 7 titik macet, lalu SERAH di Paket Selesai. Bintang 3 wajib memakai ULANGI.',
    start: { r: 0, c: 0 }, finish: { r: 5, c: 5 },
    packages: [{ id: 'A', r: 3, c: 1 }, { id: 'B', r: 2, c: 1 }, { id: 'C', r: 0, c: 1 }, { id: 'D', r: 2, c: 3 }, { id: 'E', r: 5, c: 1 }],
    jams: [{ r: 0, c: 4 }, { r: 4, c: 3 }, { r: 0, c: 5 }, { r: 4, c: 0 }, { r: 2, c: 2 }, { r: 2, c: 4 }, { r: 5, c: 2 }],
    maxLines: 39,
    stars: { three: 30, two: 34, needLoopForThree: true },
  },
  {
    id: 9, title: 'Jagoan: Enam Paket', size: 6,
    goal: 'Ambil 6 paket (A–F) berurutan, hindari 7 titik macet, lalu SERAH di Paket Selesai. Bintang 3 wajib memakai ULANGI.',
    start: { r: 5, c: 5 }, finish: { r: 0, c: 0 },
    packages: [{ id: 'A', r: 0, c: 5 }, { id: 'B', r: 3, c: 4 }, { id: 'C', r: 1, c: 1 }, { id: 'D', r: 0, c: 2 }, { id: 'E', r: 1, c: 2 }, { id: 'F', r: 1, c: 4 }],
    jams: [{ r: 2, c: 0 }, { r: 4, c: 0 }, { r: 5, c: 4 }, { r: 4, c: 4 }, { r: 0, c: 4 }, { r: 2, c: 2 }, { r: 1, c: 0 }],
    maxLines: 41,
    stars: { three: 32, two: 36, needLoopForThree: true },
  },
  {
    id: 10, title: 'Legenda: Rute Terpanjang', size: 6,
    goal: 'Ambil 6 paket (A–F) berurutan, hindari 7 titik macet, lalu SERAH di Paket Selesai. Bintang 3 wajib memakai ULANGI.',
    start: { r: 5, c: 0 }, finish: { r: 0, c: 5 },
    packages: [{ id: 'A', r: 2, c: 4 }, { id: 'B', r: 0, c: 0 }, { id: 'C', r: 1, c: 0 }, { id: 'D', r: 4, c: 2 }, { id: 'E', r: 4, c: 0 }, { id: 'F', r: 2, c: 3 }],
    jams: [{ r: 3, c: 4 }, { r: 2, c: 1 }, { r: 2, c: 0 }, { r: 1, c: 5 }, { r: 3, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
    maxLines: 46,
    stars: { three: 37, two: 41, needLoopForThree: true },
  },
];

// Target waktu (detik) untuk bonus cepat ⚡
const GOALS: Record<number, number> = { 1: 60, 2: 100, 3: 150, 4: 180, 5: 240, 6: 180, 7: 240, 8: 270, 9: 330, 10: 420 };
export const LEVELS: Level[] = RAW.map((l) => ({ ...l, timeGoal: GOALS[l.id] }));
