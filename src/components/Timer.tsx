'use client';
import { useEffect, useState } from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import { LEVELS } from '@/lib/levels';
import { fmtTime, useGame } from '@/store/gameStore';

export function Timer() {
  const start = useGame((s) => s.timerStart);
  const end = useGame((s) => s.timerEnd);
  const goal = useGame((s) => LEVELS[s.levelId - 1].timeGoal);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!start || end) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [start, end]);
  const sec = start ? Math.max(0, Math.floor(((end ?? now) - start) / 1000)) : 0;
  const state = end ? 'Level selesai!' : goal ? `⚡ Target ${fmtTime(goal)}` : 'Waktu berjalan';
  return (
    <div className={`btn3d flex shrink-0 items-center gap-2 rounded-2xl px-3 py-1 ${end ? 'bg-emerald-300 text-slate-900' : 'bg-yellow-300 text-slate-900'}`} role="timer" aria-live="off">
      <TimerIcon size={20} />
      <div className="leading-tight">
        <div className="text-xl tabular-nums">{fmtTime(sec)}</div>
        <div className="font-body text-[10px] font-bold">{state}</div>
      </div>
    </div>
  );
}
