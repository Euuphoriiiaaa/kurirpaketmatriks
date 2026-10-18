import { useSettings, Bgm } from '@/store/settingsStore';
import type { Step } from './types';

// Semua suara disintesis (Web Audio), jadi tidak butuh file aset.
let ctx: AudioContext | null = null;
const ac = () => { ctx ??= new AudioContext(); if (ctx.state === 'suspended') ctx.resume(); return ctx; };

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
  if (vol <= 0) return;
  const a = ac(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + delay;
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
}

export type Sfx = 'engine' | 'pickup' | 'crash' | 'success';
export function playSfx(k: Sfx) {
  if (typeof window === 'undefined') return;
  const v = useSettings.getState().sfxVol * 0.3;
  if (k === 'engine') tone(110, 0.1, 'sawtooth', v * 0.6);
  if (k === 'pickup') { tone(660, 0.1, 'square', v); tone(880, 0.15, 'square', v, 0.1); }
  if (k === 'crash') { tone(90, 0.5, 'sawtooth', v * 1.5); tone(55, 0.6, 'square', v, 0.05); }
  if (k === 'success') [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', v, i * 0.12));
}
export function sfxFor(s: Step) {
  if (s.done === 'win') playSfx('success');
  else if (s.done === 'fail') playSfx('crash');
  else if (s.log?.type === 'success') playSfx('pickup');
  else playSfx('engine');
}

const TRACKS: Record<Exclude<Bgm, 'off'>, { ms: number; type: OscillatorType; notes: number[] }> = {
  lofi:   { ms: 520, type: 'triangle', notes: [220, 261, 329, 392, 329, 261, 196, 247, 293, 392, 293, 247] },
  arcade: { ms: 170, type: 'square',   notes: [523, 659, 784, 659, 523, 784, 880, 784, 659, 784, 1047, 784] },
  city:   { ms: 260, type: 'sawtooth', notes: [110, 110, 165, 110, 147, 147, 220, 147, 98, 98, 147, 196] },
};
let timer: ReturnType<typeof setInterval> | null = null;
export function setBgm(name: Bgm) {
  if (timer) clearInterval(timer);
  timer = null;
  if (name === 'off') return;
  const t = TRACKS[name]; let i = 0;
  timer = setInterval(() => {
    tone(t.notes[i++ % t.notes.length], t.ms / 1000 * 1.4, t.type, useSettings.getState().bgmVol * 0.12);
  }, t.ms);
}
