'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BarChart3, History, LayoutDashboard, LogOut, Medal, Palette, Radio, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { Row, fetchPemain, sejak } from '@/lib/adminApi';
import { Ringkasan } from './admin/Ringkasan';
import { Pemain } from './admin/Pemain';
import { LevelTab } from './admin/LevelTab';
import { Peringkat } from './admin/Peringkat';
import { LogTab } from './admin/LogTab';
import { TampilanTab } from './admin/TampilanTab';
import { Avatar } from './Avatar';
import { Toast } from './admin/ui';
import { clickFx, confetti } from './admin/fx';
import type { Goto, Preset } from './admin/types';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard, desc: 'Gambaran umum game & pemain' },
  { id: 'pemain', label: 'Pemain', icon: Users, desc: 'Lihat, tambah, ubah, hapus pemain' },
  { id: 'level', label: 'Level', icon: BarChart3, desc: 'Peta & statistik tiap level' },
  { id: 'peringkat', label: 'Peringkat', icon: Medal, desc: 'Papan peringkat kurir' },
  { id: 'tampilan', label: 'Tampilan', icon: Palette, desc: 'Foto profil & background halaman login' },
  { id: 'log', label: 'Log & Pengaturan', icon: History, desc: 'Riwayat aksi & kode admin' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<Tab>('ringkasan');
  const [q, setQ] = useState('');
  const [preset, setPreset] = useState<Preset & { n: number }>({ n: 0 });
  const [live, setLive] = useState(false);
  const [synced, setSynced] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; err?: boolean }>({ msg: '' });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const user = useAuth((a) => a.user);
  const signOut = useAuth((a) => a.signOut);

  const notify = useCallback((msg: string, e?: boolean) => {
    setToast({ msg, err: e }); clearTimeout(timer.current); timer.current = setTimeout(() => setToast({ msg: '' }), 3000);
    if (!e) confetti(26);
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await fetchPemain()); setErr(''); setSynced(new Date().toISOString()); } catch (e) { setErr((e as Error).message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!live) return; const t = setInterval(load, 20000); return () => clearInterval(t); }, [live, load]);

  // kunci scroll game di belakang
  useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = o; }; }, []);

  const goto: Goto = useCallback((t, query, p) => { setQ(query ?? ''); setPreset({ ...p, n: Date.now() }); setTab(t as Tab); }, []);

  // pintasan keyboard: 1-5 pindah tab, R muat ulang
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|SELECT|TEXTAREA/.test(t.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key >= '1' && e.key <= String(TABS.length)) setTab(TABS[+e.key - 1].id);
      else if (e.key.toLowerCase() === 'r') load();
    };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  }, [load]);

  const cur = TABS.find((t) => t.id === tab)!;
  const navBtn = (id: Tab, label: string, I: typeof Users, i: number, mobile?: boolean) => (
    <motion.button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} whileTap={{ scale: 0.94 }} whileHover={{ x: mobile ? 0 : 4 }}
      className={`relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold ${tab === id ? 'text-white' : 'hover:bg-[var(--road)]'}`}>
      {tab === id && <motion.span layoutId={mobile ? 'pill-m' : 'pill'} className="absolute inset-0 -z-0 rounded-xl border-[3px] border-[var(--line)] bg-[var(--accent)] shadow-[0_3px_0_var(--line)]" transition={{ type: 'spring', damping: 24, stiffness: 320 }} />}
      <I size={18} className="relative" /><span className="relative">{label}</span>
      {id === 'pemain' && <span className="relative ml-auto rounded-full bg-black/15 px-1.5 text-xs">{rows.length}</span>}
      {!mobile && <kbd className="relative ml-auto hidden rounded bg-black/10 px-1 text-[10px] font-normal lg:block">{i + 1}</kbd>}
    </motion.button>
  );

  return (
    <motion.div className="admin-root fixed inset-0 z-50 flex select-none flex-col bg-[var(--bg)] md:flex-row [&_input]:select-text [&_td]:select-text"
      style={{ backgroundImage: 'radial-gradient(color-mix(in srgb, var(--ink) 14%, transparent) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }}
      initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
      onPointerDown={clickFx} role="dialog" aria-label="Dashboard Admin">

      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r-[3px] border-[var(--line)] bg-[var(--card)] p-3 md:flex">
        <div className="mb-3 flex items-center gap-2.5 px-1">
          <motion.div whileHover={{ rotate: -12, scale: 1.1 }} className="btn3d rounded-xl bg-amber-300 p-2 text-slate-900"><ShieldCheck size={22} /></motion.div>
          <div className="leading-tight"><div className="font-display text-lg font-extrabold">Dashboard Admin</div><div className="text-xs text-[var(--muted)]">Kurir Paket Matriks</div></div>
        </div>
        <nav className="flex flex-col gap-1" role="tablist" aria-label="Menu admin">{TABS.map((t, i) => navBtn(t.id, t.label, t.icon, i))}</nav>
        <div className="mt-auto space-y-2">
          <button onClick={() => setLive((v) => !v)} aria-pressed={live} data-fx="spark" className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold ${live ? 'border-emerald-400 bg-emerald-400/15 text-emerald-600' : 'border-[var(--road)]'}`}>
            <Radio size={16} className={live ? 'animate-pulse' : ''} />Auto-refresh {live ? 'ON (20 dtk)' : 'OFF'}</button>
          <button onClick={() => setTab('tampilan')} className="flex w-full items-center gap-2.5 rounded-xl bg-[var(--road)] px-3 py-2 text-left text-xs hover:brightness-95" aria-label="Ubah foto profil">
            <Avatar foto={user?.foto} nama={user?.username} size={42} />
            <span className="min-w-0"><span className="block text-[var(--muted)]">Masuk sebagai</span><b className="block truncate text-sm">{user?.username ?? 'admin'}</b>
              <span className="block text-[var(--muted)]">Sinkron: {sejak(synced)}</span></span></button>
          <button onClick={onClose} className="btn3d flex w-full items-center justify-center gap-2 rounded-xl bg-sky-300 py-2 text-sm text-slate-900"><ArrowLeft size={16} />Lihat Game</button>
          <button onClick={signOut} className="btn3d flex w-full items-center justify-center gap-2 rounded-xl bg-red-300 py-2 text-sm text-slate-900"><LogOut size={16} />Keluar</button>
        </div>
      </aside>

      {/* Bar atas mobile */}
      <header className="flex shrink-0 items-center gap-2 border-b-[3px] border-[var(--line)] bg-[var(--card)] p-2 md:hidden">
        <ShieldCheck size={20} /><b className="font-display">Admin</b>
        <nav className="mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist">{TABS.map((t, i) => navBtn(t.id, t.label, t.icon, i, true))}</nav>
        <button onClick={onClose} className="btn3d rounded-xl bg-sky-300 p-2 text-slate-900" aria-label="Lihat game"><ArrowLeft size={16} /></button>
        <button onClick={signOut} className="btn3d rounded-xl bg-red-300 p-2 text-slate-900" aria-label="Keluar"><LogOut size={16} /></button>
      </header>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-5">
        <div className="mb-3 flex shrink-0 items-center gap-3">
          <AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}>
            <h2 className="text-2xl font-extrabold">{cur.label}</h2><p className="text-xs text-[var(--muted)]">{cur.desc}</p></motion.div></AnimatePresence>
          <button onClick={load} disabled={loading} className="btn3d ml-auto flex items-center gap-1.5 rounded-xl bg-[var(--card)] px-3 py-2 text-sm" aria-label="Muat ulang data (R)"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /><span className="hidden sm:inline">Muat ulang</span></button>
        </div>

        {err && <p className="mb-2 shrink-0 rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-700">
          {err.includes('does not exist') || err.includes('Could not find') ? 'Fungsi database belum ada. Jalankan supabase/migration_admin_dashboard.sql di SQL Editor Supabase.' : err}</p>}

        <div className="chunky flex min-h-0 flex-1 flex-col p-3 sm:p-4">
          <AnimatePresence mode="wait">
            <motion.div key={tab} className="flex min-h-0 flex-1 flex-col overflow-y-auto" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
              {tab === 'ringkasan' && <Ringkasan rows={rows} goto={goto} />}
              {tab === 'pemain' && <Pemain rows={rows} me={user?.id} q={q} setQ={setQ} reload={load} notify={notify} loading={loading} preset={preset} />}
              {tab === 'level' && <LevelTab rows={rows} goto={goto} />}
              {tab === 'peringkat' && <Peringkat rows={rows} goto={goto} />}
              {tab === 'tampilan' && <TampilanTab notify={notify} />}
              {tab === 'log' && <LogTab notify={notify} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Toast msg={toast.msg} err={toast.err} />
    </motion.div>
  );
}
