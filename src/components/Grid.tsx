'use client';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { LEVELS } from '@/lib/levels';
import { useGame, useSnap } from '@/store/gameStore';

/** Truk tampak dari atas, default MENGHADAP ATAS (kaca depan di atas). Rotasi = dir × 90°. */
function Van({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-label="Truk kurir" style={{ display: 'block', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.35))' }}>
      {/* roda */}
      {[[7, 8], [37, 8], [7, 30], [37, 30]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="4.5" height="10" rx="2" fill="#1b2a4a" />)}
      {/* bak kargo + dus */}
      <rect x="11" y="19" width="26" height="27" rx="3.5" fill="#f8fafc" stroke="#1b2a4a" strokeWidth="2" />
      <rect x="11" y="19" width="26" height="5" fill={color} stroke="#1b2a4a" strokeWidth="2" />
      <rect x="15" y="27" width="8" height="7" rx="1" fill="#e0a869" stroke="#1b2a4a" strokeWidth="1.2" />
      <rect x="25" y="27" width="8" height="7" rx="1" fill="#e0a869" stroke="#1b2a4a" strokeWidth="1.2" />
      <rect x="19" y="35" width="10" height="7" rx="1" fill="#c98c4f" stroke="#1b2a4a" strokeWidth="1.2" />
      {/* kabin (oranye) + kaca depan */}
      <path d="M11 20 V10 Q11 2.5 19 2.5 H29 Q37 2.5 37 10 V20 Z" fill={color} stroke="#1b2a4a" strokeWidth="2" />
      <path d="M15.5 13.5 V10 Q15.5 6.5 19.5 6.5 H28.5 Q32.5 6.5 32.5 10 V13.5 Z" fill="#bfe9ff" stroke="#1b2a4a" strokeWidth="1.4" />
      <line x1="17" y1="17" x2="31" y2="17" stroke="#1b2a4a" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="14.5" cy="4.6" r="1.9" fill="#ffe066" stroke="#1b2a4a" strokeWidth=".9" /><circle cx="33.5" cy="4.6" r="1.9" fill="#ffe066" stroke="#1b2a4a" strokeWidth=".9" />
    </svg>
  );
}

const ACCENT = '#ff8a1f';

export function Grid() {
  const lv = LEVELS[useGame((s) => s.levelId) - 1];
  const snap = useSnap();
  const n = lv.size;
  const size = 100 / n;

  // Rotasi kumulatif agar putaran selalu lewat jalur terpendek (tidak berputar balik 270°).
  const rot = useRef(snap.dir * 90);
  const diff = ((snap.dir * 90 - rot.current) % 360 + 540) % 360 - 180;
  rot.current += diff;

  const at = (list: { r: number; c: number }[], r: number, c: number) => list.some((p) => p.r === r && p.c === c);
  const cu = (k: number, min = 8) => `max(${min}px, calc(100cqw / ${n} * ${k}))`; // satuan relatif ukuran arena
  const label = 'flex items-center justify-center text-xs font-extrabold text-[var(--muted)]';

  return (
    <div className="mx-auto w-full select-none lg:w-[min(100cqw,calc(100cqh_-_2.5rem))]">
      <div className="ml-7 grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {Array.from({ length: n }, (_, c) => <span key={c} className={`${label} pb-1`}>K{c + 1}</span>)}
      </div>
      <div className="flex">
        <div className="grid w-7" style={{ gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }}>
          {Array.from({ length: n }, (_, r) => <span key={r} className={label}>B{r + 1}</span>)}
        </div>
        <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl border-[3px] border-[var(--line)] [container-type:inline-size]">
          <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }}>
            {Array.from({ length: n * n }, (_, i) => {
              const r = Math.floor(i / n), c = i % n;
              const jam = at(lv.jams, r, c);
              const pkg = lv.packages.find((p) => p.r === r && p.c === c);
              const showPkg = pkg && !snap.picked.includes(pkg.id);
              const isStart = r === lv.start.r && c === lv.start.c;
              const isFinish = r === lv.finish.r && c === lv.finish.c;
              return (
                <div key={i} className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden border border-[var(--line)]/15 leading-none"
                  style={{ fontSize: cu(0.58, 16), background: jam ? 'var(--jam)' : (r + c) % 2 ? 'var(--road)' : 'color-mix(in srgb, var(--road) 70%, white)' }}>
                  {jam && <span title="Macet">🚧</span>}
                  {isStart && <span className="absolute left-0.5 top-0.5" style={{ fontSize: cu(0.22, 10) }} title="Depot">🏭</span>}
                  {isFinish && (
                    <>
                      <span title="Paket Selesai (SERAH)" style={{ marginBottom: cu(0.12, 4) }}>{snap.delivered ? '🎉' : '🏠'}</span>
                      <b className="absolute bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-[var(--line)] bg-emerald-300 px-1.5 leading-tight text-slate-900" style={{ fontSize: cu(0.11, 8) }}>{snap.delivered ? '✅ Selesai' : 'SERAH'}</b>
                      {snap.delivered && <span className="absolute right-0.5 top-0.5" style={{ fontSize: cu(0.22, 10) }}>📦</span>}
                    </>
                  )}
                  {showPkg && (
                    <span className="relative" title={`Paket ${pkg!.id}`}>📦
                      <b className="absolute grid place-items-center rounded-full border-2 border-[var(--line)] bg-yellow-300 font-display text-slate-900" style={{ right: cu(-0.04, -2), top: cu(-0.04, -2), width: cu(0.2, 16), height: cu(0.2, 16), fontSize: cu(0.11, 9) }}>{pkg!.id}</b>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <motion.div className="pointer-events-none absolute left-0 top-0 z-10" style={{ width: `${size}%`, height: `${size}%` }}
            animate={{ x: `${snap.c * 100}%`, y: `${snap.r * 100}%` }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}>
            <motion.div className="absolute inset-[6%]" animate={{ rotate: rot.current }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
              <Van color={ACCENT} />
            </motion.div>
          </motion.div>
        </div>
      </div>
      <p className="mt-1.5 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[11px] font-bold text-[var(--muted)]">
        <span>🏭 Depot</span><span>📦 AMBIL</span><span>🚧 Macet</span><span>🏠 Paket Selesai (SERAH)</span>
      </p>
    </div>
  );
}
