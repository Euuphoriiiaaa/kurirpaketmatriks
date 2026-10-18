'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Crown, Flag, Gamepad2, Star, Trophy, UserX, Users, Zap } from 'lucide-react';
import { LEVELS } from '@/lib/levels';
import { Row, statLevel, sum, sejak, terakhirMain } from '@/lib/adminApi';
import { Bar, Stars, StatCard, pop, stagger } from './ui';
import type { Goto } from './types';

const DAY = 86400000;
export function Ringkasan({ rows, goto }: { rows: Row[]; goto: Goto }) {
  const d = useMemo(() => {
    const pemain = rows.filter((r) => !r.adm), now = Date.now();
    const aktif = (ms: number) => pemain.filter((r) => { const t = terakhirMain(r) ?? r.login_terakhir; return t && now - new Date(t).getTime() < ms; }).length;
    const sudah = pemain.filter((r) => r.progres.length > 0);
    const tamat = pemain.filter((r) => r.progres.some((p) => p.level === LEVELS.length));
    const lv = statLevel(pemain);
    const dibuka = lv.filter((l) => l.selesai > 0);
    const tersulit = [...dibuka].sort((a, b) => a.rataBintang - b.rataBintang)[0];
    const macet = [...lv].reduce<{ id: number; drop: number } | null>((best, l, i) => {
      if (i === 0) return best; const drop = lv[i - 1].selesai - l.selesai;
      return !best || drop > best.drop ? { id: l.id, drop } : best;
    }, null);
    const hari = Array.from({ length: 7 }, (_, i) => {
      const s = new Date(); s.setHours(0, 0, 0, 0); s.setTime(s.getTime() - (6 - i) * DAY);
      return { label: s.toLocaleDateString('id-ID', { weekday: 'short' }), n: rows.filter((r) => { const t = new Date(r.daftar_pada).getTime(); return t >= s.getTime() && t < s.getTime() + DAY; }).length };
    });
    const distBintang = [1, 2, 3].map((s) => pemain.reduce((a, r) => a + r.progres.filter((p) => p.stars === s).length, 0));
    const perhatian = pemain.filter((r) => r.progres.length === 0 && now - new Date(r.daftar_pada).getTime() > 3 * DAY);
    const top = [...pemain].sort((a, b) => sum(b, 'score') - sum(a, 'score')).filter((r) => r.progres.length).slice(0, 3);
    const aktivitas = pemain.flatMap((r) => r.progres.filter((p) => p.updated).map((p) => ({ r, p }))).sort((a, b) => +new Date(b.p.updated!) - +new Date(a.p.updated!)).slice(0, 6);
    const rataLevel = pemain.length ? pemain.reduce((a, r) => a + r.progres.length, 0) / pemain.length : 0;
    return { pemain, aktif24: aktif(DAY), aktif7: aktif(7 * DAY), sudah, tamat, lv, tersulit, macet, hari, distBintang, perhatian, top, aktivitas, rataLevel, admin: rows.length - pemain.length };
  }, [rows]);
  const maxHari = Math.max(1, ...d.hari.map((h) => h.n)), totalBintang = d.distBintang.reduce((a, b) => a + b, 0) || 1;

  return (
    <motion.div className="space-y-4" variants={stagger} initial="hidden" animate="show">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={<Users size={14} />} label="Pemain" value={d.pemain.length} sub={`+ ${d.admin} admin`} onClick={() => goto('pemain', '', { role: 'pemain' })} />
        <StatCard icon={<Gamepad2 size={14} />} label="Sudah main" value={d.sudah.length} sub={`${d.pemain.length - d.sudah.length} belum main`} onClick={() => goto('pemain', '', { status: 'main' })} />
        <StatCard icon={<Activity size={14} />} label="Aktif 24 jam" value={d.aktif24} sub={`${d.aktif7} aktif 7 hari`} tone="text-emerald-500" onClick={() => goto('pemain', '', { sort: 'aktif' })} />
        <StatCard icon={<Flag size={14} />} label="Tamat level 10" value={d.tamat.length} sub={`rata-rata ${d.rataLevel.toFixed(1)}/${LEVELS.length} level`} tone="text-amber-500" onClick={() => goto('pemain', '', { status: 'tamat' })} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <motion.section variants={pop} className="rounded-2xl border-2 border-[var(--road)] p-3">
          <h4 className="mb-2 font-extrabold">Corong level — berapa % pemain yang menyelesaikan</h4>
          <div className="space-y-1.5">
            {d.lv.map((l) => (
              <button key={l.id} onClick={() => goto('level')} className="flex w-full items-center gap-2 text-left text-sm hover:opacity-80">
                <span className="w-14 shrink-0 font-bold">Lv {l.id}</span>
                <Bar value={l.persen} color={l.persen < 30 ? '#f87171' : l.persen < 60 ? '#fbbf24' : '#34d399'} h={12} />
                <span className="w-24 shrink-0 text-right text-xs text-[var(--muted)]">{l.selesai} pemain · {l.persen}%</span>
              </button>
            ))}
          </div>
          {d.tersulit && <p className="mt-3 rounded-xl bg-[var(--road)] px-3 py-2 text-xs">🔥 Level paling menyulitkan (bintang rata-rata terendah): <b>Level {d.tersulit.id} — {d.tersulit.judul}</b> ({d.tersulit.rataBintang.toFixed(1)}⭐).{d.macet && d.macet.drop > 0 && <> Penurunan pemain terbesar terjadi di <b>Level {d.macet.id}</b> (−{d.macet.drop}).</>}</p>}
        </motion.section>

        <motion.div variants={pop} className="space-y-3">
          <motion.section variants={pop} className="rounded-2xl border-2 border-[var(--road)] p-3">
            <h4 className="mb-2 font-extrabold">Pendaftar 7 hari terakhir</h4>
            <div className="flex h-24 items-end gap-1.5">
              {d.hari.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-bold">{h.n || ''}</span>
                  <div className="w-full rounded-t-md bg-[var(--accent)]" style={{ height: `${(h.n / maxHari) * 100}%`, minHeight: h.n ? 4 : 2, opacity: h.n ? 1 : 0.25 }} />
                  <span className="text-[10px] text-[var(--muted)]">{h.label}</span>
                </div>
              ))}
            </div>
          </motion.section>
          <motion.section variants={pop} className="rounded-2xl border-2 border-[var(--road)] p-3">
            <h4 className="mb-2 font-extrabold">Sebaran bintang</h4>
            {[3, 2, 1].map((s) => (
              <div key={s} className="mb-1 flex items-center gap-2 text-xs"><Stars n={s} size={12} /><Bar value={(d.distBintang[s - 1] / totalBintang) * 100} color="#fbbf24" /><span className="w-8 text-right font-bold">{d.distBintang[s - 1]}</span></div>
            ))}
          </motion.section>
        </motion.div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <motion.section variants={pop} className="rounded-2xl border-2 border-[var(--road)] p-3">
          <h4 className="mb-2 flex items-center gap-1.5 font-extrabold"><Trophy size={16} className="text-amber-500" />3 Kurir Terbaik</h4>
          {d.top.length === 0 ? <p className="text-sm text-[var(--muted)]">Belum ada yang menyelesaikan level.</p> : d.top.map((r, i) => (
            <button key={r.uid} onClick={() => goto('pemain', r.nama ?? '')} className="mb-1 flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hv-row">
              <span className="w-6 text-lg">{['🥇', '🥈', '🥉'][i]}</span><b className="truncate">{r.nama}</b>
              <span className="ml-auto text-xs text-[var(--muted)]">{r.progres.length}/10 · {sum(r, 'stars')}⭐ · {sum(r, 'score')} poin</span>
            </button>
          ))}
        </motion.section>
        <motion.section variants={pop} className="rounded-2xl border-2 border-[var(--road)] p-3">
          <h4 className="mb-2 flex items-center gap-1.5 font-extrabold"><UserX size={16} className="text-red-400" />Perlu Perhatian</h4>
          <p className="mb-1 text-xs text-[var(--muted)]">Terdaftar lebih dari 3 hari tapi belum menyelesaikan level apa pun.</p>
          {d.perhatian.length === 0 ? <p className="text-sm">Semua pemain sudah mulai bermain 🎉</p> : d.perhatian.slice(0, 5).map((r) => (
            <button key={r.uid} onClick={() => goto('pemain', r.nama ?? '')} className="flex w-full items-center gap-2 rounded-xl px-2 py-1 text-left text-sm hv-row">
              <b className="truncate">{r.nama}</b><span className="ml-auto text-xs text-[var(--muted)]">login {sejak(r.login_terakhir)}</span>
            </button>
          ))}
          {d.perhatian.length > 5 && <p className="mt-1 text-xs text-[var(--muted)]">+{d.perhatian.length - 5} lainnya</p>}
        </motion.section>
      </div>
      <motion.section variants={pop} className="rounded-2xl border-2 border-[var(--road)] p-3">
        <h4 className="mb-2 flex items-center gap-1.5 font-extrabold"><Zap size={16} className="text-sky-400" />Aktivitas Terbaru</h4>
        {d.aktivitas.length === 0 ? <p className="text-sm text-[var(--muted)]">Belum ada aktivitas bermain.</p> : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {d.aktivitas.map(({ r, p }) => (
              <li key={`${r.uid}-${p.level}`}><button onClick={() => goto('pemain', r.nama ?? '')} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hv-row">
                <b className="truncate">{r.nama}</b><span className="text-xs text-[var(--muted)]">selesai Level {p.level}</span><Stars n={p.stars} size={11} /><span className="ml-auto text-xs text-[var(--muted)]">{sejak(p.updated)}</span></button></li>
            ))}
          </ul>
        )}
      </motion.section>
      <p className="flex items-center gap-1 text-[11px] text-[var(--muted)]"><Crown size={12} />Statistik hanya menghitung akun berstatus pemain (admin tidak ikut). <Star size={12} />Maksimal {LEVELS.length * 3} bintang per pemain.</p>
    </motion.div>
  );
}
