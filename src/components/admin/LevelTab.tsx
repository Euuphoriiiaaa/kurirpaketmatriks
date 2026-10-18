'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Timer, Truck } from 'lucide-react';
import { LEVELS } from '@/lib/levels';
import { Row, statLevel } from '@/lib/adminApi';
import { Bar, Stars } from './ui';
import type { Goto } from './types';
import { MiniMap } from './MiniMap';

export function LevelTab({ rows, goto }: { rows: Row[]; goto: Goto }) {
  const [sel, setSel] = useState(1);
  const stats = useMemo(() => statLevel(rows.filter((r) => !r.adm)), [rows]);
  const lv = LEVELS[sel - 1], st = stats[sel - 1];
  const best = useMemo(() => rows.filter((r) => !r.adm).flatMap((r) => r.progres.filter((p) => p.level === sel).map((p) => ({ r, p })))
    .sort((a, b) => b.p.stars - a.p.stars || a.p.lines - b.p.lines || b.p.score - a.p.score).slice(0, 5), [rows, sel]);
  const sulit = st.selesai > 0 && st.rataBintang < 2 ? 'Sulit' : st.selesai === 0 ? 'Belum dimainkan' : st.rataBintang >= 2.6 ? 'Mudah' : 'Sedang';
  const kv = 'rounded-xl bg-[var(--road)] px-3 py-2 text-sm';
  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-[13rem_1fr]">
      <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Pilih level">
        {LEVELS.map((l, i) => (
          <motion.button whileTap={{ scale: 0.95 }} whileHover={{ x: 3 }} key={l.id} onClick={() => setSel(l.id)} className={`flex shrink-0 items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm ${sel === l.id ? 'border-[var(--accent)] bg-acc-soft font-bold' : 'border-[var(--road)]'}`}>
            <span className="font-extrabold">{l.id}</span><span className="hidden flex-1 truncate lg:block">{l.title.split(': ')[1]}</span>
            <span className="ml-auto text-[10px] text-[var(--muted)]">{stats[i].persen}%</span>
          </motion.button>
        ))}
      </nav>
      <motion.div key={sel} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', damping: 24, stiffness: 260 }} className="space-y-3 overflow-y-auto">
        <div className="flex flex-wrap gap-4 rounded-2xl border-2 border-[var(--road)] p-3">
          <MiniMap lv={lv} />
          <div className="min-w-[14rem] flex-1 space-y-2">
            <h4 className="text-lg font-extrabold">Level {lv.id}: {lv.title.split(': ')[1]} <span className="ml-1 rounded-full bg-[var(--road)] px-2 py-0.5 align-middle text-xs">{lv.title.split(': ')[0]}</span></h4>
            <p className="text-sm text-[var(--muted)]">{lv.goal}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className={kv}><Truck size={14} className="mb-0.5 mr-1 inline" />{lv.packages.length} paket · {lv.jams.length} macet</div>
              <div className={kv}><Timer size={14} className="mb-0.5 mr-1 inline" />Target waktu {lv.timeGoal}s</div>
              <div className={kv}>Batas baris <b>{lv.maxLines}</b></div>
              <div className={kv}>⭐3 ≤ <b>{lv.stars.three}</b> · ⭐2 ≤ <b>{lv.stars.two}</b> baris</div>
              <div className={`${kv} col-span-2`}><Repeat size={14} className="mb-0.5 mr-1 inline" />{lv.stars.needLoopForThree ? 'Bintang 3 wajib memakai ULANGI' : 'Bintang 3 tidak wajib ULANGI'}</div>
            </div>
            <p className="text-[11px] text-[var(--muted)]">Pratinjau 🚚 depot · A–F paket (urutan ambil) · 🚧 macet · 🏠 serah. Konfigurasi level ada di <code>src/lib/levels.ts</code>.</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <div className={kv}><div className="text-xs text-[var(--muted)]">Selesai</div><b className="text-lg">{st.selesai}</b> pemain ({st.persen}%)</div>
          <div className={kv}><div className="text-xs text-[var(--muted)]">Rata-rata bintang</div><b className="text-lg">{st.rataBintang.toFixed(1)}</b> ⭐</div>
          <div className={kv}><div className="text-xs text-[var(--muted)]">Rata-rata skor · baris</div><b className="text-lg">{Math.round(st.rataSkor)}</b> · {st.rataBaris.toFixed(1)}</div>
          <div className={kv}><div className="text-xs text-[var(--muted)]">Tingkat kesulitan</div><b className="text-lg">{sulit}</b></div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-2xl border-2 border-[var(--road)] p-3">
            <h5 className="mb-2 font-extrabold">Sebaran bintang</h5>
            {[3, 2, 1].map((s) => <div key={s} className="mb-1.5 flex items-center gap-2 text-xs"><Stars n={s} size={12} /><Bar value={st.selesai ? (st.dist[s - 1] / st.selesai) * 100 : 0} color="#fbbf24" h={10} /><b className="w-6 text-right">{st.dist[s - 1]}</b></div>)}
          </section>
          <section className="rounded-2xl border-2 border-[var(--road)] p-3">
            <h5 className="mb-2 font-extrabold">Penyelesaian terbaik</h5>
            {best.length === 0 ? <p className="text-sm text-[var(--muted)]">Belum ada yang menyelesaikan level ini.</p> : best.map(({ r, p }, i) => (
              <button key={r.uid} onClick={() => goto('pemain', r.nama ?? '')} className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-sm hv-row">
                <span className="w-5 text-xs font-bold text-[var(--muted)]">{i + 1}</span><b className="truncate">{r.nama}</b><Stars n={p.stars} size={11} />
                <span className="ml-auto text-xs text-[var(--muted)]">{p.lines} baris · {p.score} poin</span>
              </button>
            ))}
          </section>
        </div>
      </motion.div>
    </div>
  );
}
