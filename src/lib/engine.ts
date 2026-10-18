import { Cmd, Dir, Level, Snap, Step } from './types';

const DELTA: Record<Dir, [number, number]> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] };
export const MAX_STEPS = 500;
export const cell = (r: number, c: number) => `B${r + 1}-K${c + 1}`;
export const initialSnap = (lv: Level): Snap => ({ ...lv.start, dir: 1, picked: [], delivered: false });

/** State machine murni: menghasilkan seluruh langkah animasi. */
export function simulate(lv: Level, cmds: Cmd[]): Step[] {
  let s = initialSnap(lv);
  const steps: Step[] = [{ snap: s, line: 0, log: { type: 'info', text: `Kurir siap di Depot ${cell(s.r, s.c)} menghadap Kanan.` } }];
  const push = (snap: Snap, line: number, type: 'info' | 'success' | 'error', text: string, done?: 'win' | 'fail') => {
    s = snap; steps.push({ snap, line, log: { type, text }, done });
  };
  const fail = (line: number, text: string) => push(s, line, 'error', `[ERROR] ${text}`, 'fail');

  for (const { op, line } of cmds) {
    if (steps.length > MAX_STEPS) return (fail(line, 'Terlalu banyak langkah (kemungkinan loop tak berujung).'), steps);

    if (op === 'KANAN' || op === 'KIRI' || op === 'BALIK') {
      const add = op === 'KANAN' ? 1 : op === 'KIRI' ? 3 : 2;
      push({ ...s, dir: ((s.dir + add) % 4) as Dir }, line, 'info', `Putar: ${op}.`);
    } else if (op === 'MAJU' || op === 'MUNDUR') {
      const k = op === 'MAJU' ? 1 : -1;
      const [dr, dc] = DELTA[s.dir];
      const r = s.r + dr * k, c = s.c + dc * k;
      if (r < 0 || c < 0 || r >= lv.size || c >= lv.size) return (fail(line, `Keluar batas grid dari ${cell(s.r, s.c)}!`), steps);
      if (lv.jams.some((j) => j.r === r && j.c === c)) return (fail(line, `Menabrak area kemacetan di ${cell(r, c)}!`), steps);
      push({ ...s, r, c }, line, 'info', `${op} ke ${cell(r, c)}.`);
    } else if (op === 'AMBIL') {
      const here = lv.packages.find((p) => p.r === s.r && p.c === s.c);
      if (!here) return (fail(line, `Tidak ada paket di ${cell(s.r, s.c)}.`), steps);
      if (s.picked.includes(here.id)) return (fail(line, `Paket ${here.id} sudah diambil.`), steps);
      const expected = lv.packages[s.picked.length].id;
      if (here.id !== expected) return (fail(line, `Urutan salah! Ambil Paket ${expected} dulu.`), steps);
      push({ ...s, picked: [...s.picked, here.id] }, line, 'success', `[SUCCESS] Paket ${here.id} berhasil diambil!`);
    } else if (op === 'SERAH') {
      if (s.r !== lv.finish.r || s.c !== lv.finish.c) return (fail(line, `SERAH hanya bisa di Paket Selesai ${cell(lv.finish.r, lv.finish.c)}.`), steps);
      if (s.picked.length < lv.packages.length) return (fail(line, `Baru ${s.picked.length}/${lv.packages.length} paket terambil.`), steps);
      push({ ...s, delivered: true }, line, 'success', '[SUCCESS] Semua paket terkirim! Level selesai.', 'win');
      return steps;
    }
  }
  fail(cmds.at(-1)?.line ?? 0, 'Program selesai, tetapi paket belum diserahkan di Paket Selesai.');
  return steps;
}

export function calcStars(lv: Level, lines: number, usesLoop: boolean): 1 | 2 | 3 {
  if (lines <= lv.stars.three && (!lv.stars.needLoopForThree || usesLoop)) return 3;
  return lines <= lv.stars.two ? 2 : 1;
}
export const calcScore = (stars: number, lv: Level, lines: number) =>
  stars * 100 + Math.max(0, lv.stars.two - lines) * 10;
