'use client';
import { useEffect, useState } from 'react';
import { Truck, Menu, HelpCircle, ShieldCheck } from 'lucide-react';
import { Grid } from '@/components/Grid';
import { CodeEditor } from '@/components/CodeEditor';
import { Controls } from '@/components/Controls';
import { Console } from '@/components/Console';
import { LevelSelector } from '@/components/LevelSelector';
import { Timer } from '@/components/Timer';
import { Tutorial } from '@/components/Tutorial';
import { Sidebar } from '@/components/Sidebar';
import { AuthModal } from '@/components/AuthModal';
import { AdminPanel } from '@/components/AdminPanel';
import { DbBadge } from '@/components/DbBadge';
import { LEVELS } from '@/lib/levels';
import { supabase } from '@/lib/supabase';
import { useGame } from '@/store/gameStore';
import { useAuth } from '@/store/authStore';
import { useSettings } from '@/store/settingsStore';

export default function Home() {
  const lv = LEVELS[useGame((s) => s.levelId) - 1];
  const theme = useSettings((s) => s.theme);
  const { init, user, ready, isAdmin, roleReady } = useAuth();
  // admin selalu mendarat di dashboard; tombol "Kembali ke Game" menggantinya ke tampilan game
  const [view, setView] = useState<'admin' | 'game'>('admin');
  const [guest, setGuest] = useState(false);
  const [side, setSide] = useState(false);
  const [auth, setAuth] = useState(false);
  const [tut, setTut] = useState(false);
  const tutorialSeen = useSettings((s) => s.tutorialSeen);
  const playing = ready && (!!user || guest);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { setView('admin'); }, [user?.id]); // akun baru login → mulai dari dashboard (jika admin)
  const inAdmin = isAdmin && view === 'admin';
  useEffect(() => { if (playing && roleReady && !inAdmin && !tutorialSeen) setTut(true); }, [playing, roleReady, inAdmin, tutorialSeen]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  // Gerbang: wajib login/daftar sebelum bermain
  if (!ready) return <main className="flex min-h-screen items-center justify-center font-bold">Memuat...</main>;
  // sudah login tapi peran belum dicek: tahan dulu agar admin tidak sempat melihat game
  if (user && !roleReady) return <main className="flex min-h-screen items-center justify-center font-bold">Memuat akun...</main>;
  if (inAdmin) return <AdminPanel onClose={() => setView('game')} />;
  if (!user && !guest) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="btn3d rounded-2xl bg-[var(--accent)] p-3 text-white"><Truck size={32} /></div>
      <h1 className="text-3xl font-extrabold">Kurir Paket Matriks</h1>
      <DbBadge />
      <p className="text-[var(--muted)]">Masuk atau daftar dulu untuk mulai bermain.</p>
      {supabase ? <AuthModal /> : (
        <div className="chunky max-w-sm space-y-3 p-4 text-sm">
          <p>Supabase belum dikonfigurasi, jadi login belum bisa dipakai. Isi <b>.env.local</b> lalu restart <code>npm run dev</code>.</p>
          <button onClick={() => setGuest(true)} className="btn3d w-full rounded-xl bg-[var(--accent)] py-2 text-white">Main sebagai tamu (sementara)</button>
        </div>
      )}
    </main>
  );

  return (
    <main className="mx-auto flex max-w-[110rem] flex-col p-3 lg:h-[100dvh] lg:overflow-hidden lg:p-4">
      <header className="mb-3 flex shrink-0 items-center gap-3">
        <div className="btn3d rounded-2xl bg-[var(--accent)] p-2 text-white"><Truck size={24} /></div>
        <h1 className="text-2xl font-bold sm:text-3xl">Kurir Paket Matriks</h1>
        <span className="ml-auto"><DbBadge /></span>
        {isAdmin && <button onClick={() => setView('admin')} className="btn3d flex items-center gap-1.5 rounded-2xl bg-amber-300 px-3 py-2 text-slate-900"><ShieldCheck size={20} /><span className="hidden sm:inline">Admin</span></button>}
        <button onClick={() => setTut(true)} className="btn3d flex items-center gap-1.5 rounded-2xl bg-sky-300 px-3 py-2 text-slate-900"><HelpCircle size={20} /><span className="hidden sm:inline">Tutorial</span></button>
        <button onClick={() => setSide(true)} className="btn3d rounded-2xl bg-[var(--card)] p-2.5 text-[var(--ink)]" aria-label="Menu"><Menu /></button>
      </header>
      <div className="grid gap-4 pb-2 lg:min-h-0 lg:flex-1 lg:grid-cols-[min(58%,calc(100dvh_-_8rem))_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <section className="chunky flex min-h-0 flex-col p-3">
          <div className="mb-2 flex shrink-0 items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="min-w-0 flex-1 truncate text-lg font-bold">Level {lv.id}: {lv.title.split(': ')[1] ?? lv.title}</h2>
            </div>
            <Timer />
          </div>
          <div className="min-h-0 flex-1 lg:[container-type:size]"><Grid /></div>
        </section>
        <section className="chunky flex min-h-0 flex-col gap-2 overflow-y-auto p-3">
          <p className="shrink-0 rounded-xl bg-[var(--road)] px-3 py-1.5 text-sm font-semibold leading-snug">🎯 {lv.goal}</p>
          <LevelSelector />
          <CodeEditor />
          <Controls />
          <Console />
        </section>
      </div>
      <Sidebar open={side} onClose={() => setSide(false)} onAuth={() => { setSide(false); setAuth(true); }} />
      {auth && <AuthModal onClose={() => setAuth(false)} />}
      {tut && <Tutorial onClose={() => setTut(false)} />}
    </main>
  );
}
