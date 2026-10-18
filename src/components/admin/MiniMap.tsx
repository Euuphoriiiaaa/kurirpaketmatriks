import { Level } from '@/lib/types';

/** Pratinjau peta level 6×6: depot, paket (A–F), macet, titik serah. */
export function MiniMap({ lv, size = 168 }: { lv: Level; size?: number }) {
  const n = lv.size, cell = size / n;
  const at = (r: number, c: number) => {
    if (lv.start.r === r && lv.start.c === c) return { t: '🚚', bg: 'var(--road)' };
    if (lv.finish.r === r && lv.finish.c === c) return { t: '🏠', bg: '#bbf7d0' };
    const p = lv.packages.find((x) => x.r === r && x.c === c); if (p) return { t: p.id, bg: '#fed7aa' };
    if (lv.jams.some((j) => j.r === r && j.c === c)) return { t: '🚧', bg: '#fde68a' };
    return { t: '', bg: 'transparent' };
  };
  return (
    <div className="grid rounded-xl border-2 border-[var(--line)] bg-[var(--card)]" style={{ width: size, height: size, gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-label={`Peta level ${lv.id}`}>
      {Array.from({ length: n * n }, (_, i) => {
        const r = Math.floor(i / n), c = i % n, x = at(r, c);
        return <div key={i} className="flex items-center justify-center border border-[var(--road)] font-extrabold" style={{ background: x.bg, fontSize: cell * 0.45 }}>{x.t}</div>;
      })}
    </div>
  );
}
