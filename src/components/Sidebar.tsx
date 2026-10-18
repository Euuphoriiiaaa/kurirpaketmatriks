'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, LogOut, Star, X } from 'lucide-react';
import { LEVELS } from '@/lib/levels';
import { useGame } from '@/store/gameStore';
import { useAuth } from '@/store/authStore';
import { ThemePicker } from './ThemePicker';
import { Avatar } from './Avatar';
import { AudioPanel } from './AudioPanel';

export function Sidebar({ open, onClose, onAuth }: { open: boolean; onClose: () => void; onAuth: () => void }) {
  const { user, signOut } = useAuth();
  const progress = useGame((s) => s.progress);
  const done = Object.keys(progress).length;
  const total = Object.values(progress).reduce((a, r) => a + r.score, 0);
  const h = 'mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--muted)]';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className="fixed right-0 top-0 z-40 h-full w-80 max-w-full space-y-5 overflow-y-auto bg-[var(--card)] p-5 shadow-2xl"
            initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
            <button className="float-right" onClick={onClose} aria-label="Tutup"><X /></button>
            <section>
              <h3 className={h}>Profil</h3>
              {user ? (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 font-bold">{user.foto && <Avatar foto={user.foto} nama={user.username} size={36} />}<span>{user.username} <span className="block text-xs font-normal text-[var(--muted)]">{user.email}</span></span></p>
                  <button onClick={signOut} className="flex items-center gap-1 text-sm text-red-600"><LogOut size={14} />Keluar</button>
                </div>
              ) : (
                <button onClick={onAuth} className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white">
                  <LogIn size={16} />Masuk / Daftar
                </button>
              )}
              <p className="mt-3 text-sm">Total skor: <b>{total}</b> · Level selesai: <b>{done}/{LEVELS.length}</b></p>
              <ul className="mt-2 space-y-1 text-sm">
                {LEVELS.map((l) => (
                  <li key={l.id} className="flex items-center gap-1">Level {l.id}
                    <span className="ml-auto flex">{[1, 2, 3].map((n) => (
                      <Star key={n} size={14} className={progress[l.id] && n <= progress[l.id].stars ? 'fill-yellow-400 text-yellow-400' : 'opacity-30'} />
                    ))}</span>
                  </li>
                ))}
              </ul>
              {!user && <p className="mt-2 text-xs text-[var(--muted)]">Masuk agar progres tersimpan di semua perangkat.</p>}
            </section>
            <section><h3 className={h}>Tema</h3><ThemePicker /></section>
            <section><h3 className={h}>Audio</h3><AudioPanel /></section>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
