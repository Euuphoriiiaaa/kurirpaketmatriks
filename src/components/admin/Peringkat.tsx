'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LEVELS } from '@/lib/levels';
import { Row, sum, tgl } from '@/lib/adminApi';
import { Bar, Stars, inputCls, thCls } from './ui';
import type { Goto } from './types';

export function Peringkat({ rows, goto }: { rows: Row[]; goto: Goto }) {
  const [lv, setLv] = useState(0); // 0 = total semua level
  const [admin, setAdmin] = useState(false);
  const data = useMemo(() => rows.filter((r) => admin || !r.adm).map((r) => {
    const ps = lv ? r.progres.filter((p) => p.level === lv) : r.progres;
    return { r, lv: ps.length, stars: ps.reduce((a, p) => a + p.stars, 0), score: ps.reduce((a, p) => a + p.score, 0), lines: ps.reduce((a, p) => a + p.lines, 0), last: ps.reduce<string | undefined>((a, p) => (p.updated && (!a || p.updated > a) ? p.updated : a), undefined) };
  }).filter((x) => x.lv > 0).sort((a, b) => b.score - a.score || b.stars - a.stars || a.lines - b.lines), [rows, lv, admin]);
  const top = data[0]?.score || 1;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${inputCls} !w-auto`} value={lv} onChange={(e) => setLv(+e.target.value)} aria-label="Pilih level">
          <option value={0}>Semua level (total)</option>{LEVELS.map((l) => <option key={l.id} value={l.id}>Level {l.id} — {l.title.split(': ')[1]}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />Sertakan admin</label>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border-2 border-[var(--road)]">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="sticky top-0 bg-[var(--card)]"><tr className="border-b-2 border-[var(--road)]"><th className={thCls}>#</th><th className={thCls}>Pemain</th><th className={thCls}>Level</th><th className={thCls}>Bintang</th><th className={thCls}>Skor</th><th className={thCls}>Baris</th><th className={thCls}>Terakhir main</th></tr></thead>
          <tbody>
            {data.map((x, i) => (
              <motion.tr key={x.r.uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => goto('pemain', x.r.nama ?? '')} className="cursor-pointer border-b border-[var(--road)] hv-row">
                <td className="px-3 py-2 text-lg">{['🥇', '🥈', '🥉'][i] ?? <span className="text-sm font-bold text-[var(--muted)]">{i + 1}</span>}</td>
                <td className="px-3 py-2 font-bold">{x.r.nama}</td>
                <td className="px-3 py-2">{lv ? <Stars n={x.stars} size={12} /> : `${x.lv}/${LEVELS.length}`}</td>
                <td className="px-3 py-2">{x.stars}</td>
                <td className="w-48 px-3 py-2"><div className="flex items-center gap-2"><Bar value={(x.score / top) * 100} h={8} /><b className="w-12 shrink-0 text-right">{x.score}</b></div></td>
                <td className="px-3 py-2">{x.lines}</td><td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--muted)]">{tgl(x.last)}</td>
              </motion.tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-[var(--muted)]">Belum ada data peringkat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
