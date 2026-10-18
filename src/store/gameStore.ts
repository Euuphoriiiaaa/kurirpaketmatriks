import { create } from 'zustand';
import { LEVELS } from '@/lib/levels';
import { parse } from '@/lib/parser';
import { simulate, initialSnap, calcStars, calcScore } from '@/lib/engine';
import type { Step, Snap, LevelId } from '@/lib/types';
import { sfxFor } from '@/lib/audio';
import { saveProgress } from '@/lib/sync';

type Status = 'idle' | 'playing' | 'paused' | 'won' | 'failed';
export interface Result { stars: 1 | 2 | 3; score: number; lines: number; time?: number; fast?: boolean }
export const fmtTime = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

interface GameState {
  levelId: LevelId;
  code: string;
  steps: Step[];
  idx: number;
  status: Status;
  delay: number;
  logs: { type: string; text: string }[];
  result: Result | null;
  progress: Record<number, Result>;        // dasar sinkronisasi ke Supabase
  timerStart: number | null;               // mulai saat siswa pertama kali mengetik / menjalankan kode
  timerEnd: number | null;
  startTimer: () => void;
  setLevel: (id: LevelId) => void;
  setCode: (c: string) => void;
  run: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
}

let timer: ReturnType<typeof setInterval> | null = null;
const stop = () => { if (timer) clearInterval(timer); timer = null; };

export const useGame = create<GameState>((set, get) => {
  const lvl = () => LEVELS[get().levelId - 1];

  /** Kompilasi kode -> steps. Return false jika ada error sintaks / batas baris. */
  function compile(): boolean {
    const lv = lvl();
    const { cmds, lineCount, errors } = parse(get().code);
    const err = errors[0] ?? (lineCount > lv.maxLines ? `Batas ${lv.maxLines} baris terlampaui (${lineCount}).` : '');
    if (err || !cmds.length) {
      set({ status: 'failed', steps: [], idx: 0, logs: [{ type: 'error', text: `[ERROR] ${err || 'Editor masih kosong.'}` }] });
      return false;
    }
    set({ steps: simulate(lv, cmds), idx: 0, result: null, logs: [] });
    return true;
  }

  /** Maju satu langkah; menangani kondisi akhir. */
  function advance() {
    const { steps, idx, code, progress } = get();
    const next = idx + 1;
    if (next >= steps.length) return stop();
    const step = steps[next];
    sfxFor(step);
    const logs = steps.slice(0, next + 1).flatMap((s) => (s.log ? [s.log] : []));
    if (step.done === 'win') {
      stop();
      const lv = lvl();
      const { lineCount, usesLoop } = parse(code);
      const stars = calcStars(lv, lineCount, usesLoop);
      const { timerStart } = get();
      const time = timerStart ? Math.max(1, Math.round((Date.now() - timerStart) / 1000)) : undefined;
      const fast = !!(time && lv.timeGoal && time <= lv.timeGoal);
      const result = { stars, score: calcScore(stars, lv, lineCount) + (fast ? 50 : 0), lines: lineCount, time, fast };
      const best = progress[lv.id];
      saveProgress(lv.id, !best || result.score > best.score ? result : best);
      set({ idx: next, logs, status: 'won', result, timerEnd: Date.now(),
        progress: { ...progress, [lv.id]: !best || result.score > best.score ? result : best } });
    } else if (step.done === 'fail') {
      stop(); set({ idx: next, logs, status: 'failed' });
    } else set({ idx: next, logs });
  }

  return {
    levelId: 1, code: '', steps: [], idx: 0, status: 'idle', delay: 600,
    logs: [], result: null, progress: {}, timerStart: null, timerEnd: null,
    startTimer: () => { if (get().timerStart === null) set({ timerStart: Date.now(), timerEnd: null }); },
    setLevel: (id) => { stop(); set({ levelId: id, code: '', steps: [], idx: 0, status: 'idle', logs: [], result: null, timerStart: null, timerEnd: null }); },
    setCode: (code) => { set({ code }); if (code.trim()) get().startTimer(); },
    run: () => {
      stop(); get().startTimer();
      if (!compile()) return;
      set({ status: 'playing' });
      timer = setInterval(advance, get().delay);
    },
    pause: () => { if (get().status === 'playing') { stop(); set({ status: 'paused' }); } },
    stepOnce: () => {
      get().startTimer();
      if (get().status === 'idle' || get().status === 'failed' || get().status === 'won') { stop(); if (!compile()) return; }
      stop(); set({ status: 'paused' }); advance();
    },
    reset: () => { stop(); set({ steps: [], idx: 0, status: 'idle', logs: [], result: null }); },
  };
});

/** Snapshot kurir saat ini (untuk komponen Grid). */
export const useSnap = (): Snap => useGame((s) => s.steps[s.idx]?.snap ?? initialSnap(LEVELS[s.levelId - 1]));
