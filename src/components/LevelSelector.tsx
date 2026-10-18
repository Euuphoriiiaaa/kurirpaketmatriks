'use client';
import { Star } from 'lucide-react';
import { LEVELS } from '@/lib/levels';
import { useGame } from '@/store/gameStore';

export function LevelSelector() {
  const { levelId, setLevel, progress } = useGame();
  return (
    <div className="grid shrink-0 grid-cols-5 gap-1.5 lg:grid-cols-10">
      {LEVELS.map((l) => {
        const best = progress[l.id];
        const active = l.id === levelId;
        return (
          <button key={l.id} onClick={() => setLevel(l.id)} aria-label={`Level ${l.id}`} aria-pressed={active}
            className={`btn3d rounded-xl py-0.5 text-base ${active ? 'bg-[var(--accent)] text-white' : 'bg-[var(--road)] text-[var(--ink)]'}`}>
            {l.id}
            <span className="flex justify-center">
              {[1, 2, 3].map((n) => (
                <Star key={n} className={`h-3.5 w-3.5 ${best && n <= best.stars ? 'fill-yellow-300 text-yellow-400' : 'opacity-30'}`} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
