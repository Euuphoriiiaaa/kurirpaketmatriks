'use client';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import { useGame } from '@/store/gameStore';

export function Controls() {
  const { run, pause, stepOnce, reset, status } = useGame();
  const btn = 'btn3d flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-2 py-1.5 text-base text-slate-900';
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
      <button className={`${btn} bg-emerald-400`} onClick={run} disabled={status === 'playing'}><Play size={18} />Jalankan</button>
      <button className={`${btn} bg-sky-300`} onClick={pause} disabled={status !== 'playing'}><Pause size={18} />Jeda</button>
      <button className={`${btn} bg-violet-300`} onClick={stepOnce}><StepForward size={18} />Langkah</button>
      <button className={`${btn} bg-slate-200`} onClick={reset}><RotateCcw size={18} />Ulang</button>
    </div>
  );
}
