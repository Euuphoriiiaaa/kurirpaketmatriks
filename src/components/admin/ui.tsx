'use client';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { Star, X } from 'lucide-react';

export const inputCls = 'w-full rounded-xl border-2 border-[var(--road)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]';
export const thCls = 'px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-[var(--muted)]';

export function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return <span className="inline-flex">{[1, 2, 3].map((i) => <Star key={i} size={size} className={i <= n ? 'fill-yellow-400 text-yellow-400' : 'opacity-25'} />)}</span>;
}

export function Bar({ value, color = 'var(--accent)', h = 8 }: { value: number; color?: string; h?: number }) {
  return <div className="w-full overflow-hidden rounded-full bg-[var(--road)]" style={{ height: h }}><motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ background: color }} /></div>;
}

export function CountUp({ to, dec = 0 }: { to: number; dec?: number }) {
  const [v, setV] = useState(0), from = useRef(0);
  useEffect(() => { const c = animate(from.current, to, { duration: 0.9, ease: 'easeOut', onUpdate: (x) => setV(x) }); from.current = to; return () => c.stop(); }, [to]);
  return <>{v.toFixed(dec)}</>;
}

export function StatCard({ icon, label, value, sub, tone, onClick }: { icon: ReactNode; label: string; value: ReactNode; sub?: string; tone?: string; onClick?: () => void }) {
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag onClick={onClick} variants={pop} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
      className={`rounded-2xl border-2 border-[var(--road)] bg-[var(--card)] p-3 text-left ${onClick ? 'cursor-pointer hover:border-[var(--accent)] hover:shadow-[0_6px_0_var(--accent)]' : ''}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]"><span className={tone}>{icon}</span>{label}</div>
      <div className="mt-1 text-3xl font-extrabold">{typeof value === 'number' ? <CountUp to={value} /> : value}</div>
      {sub && <div className="text-xs text-[var(--muted)]">{sub}</div>}
    </Tag>
  );
}

export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
export const pop = { hidden: { opacity: 0, y: 14, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 20, stiffness: 260 } } };

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [onClose]);
  return (
    <motion.div data-modal className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }} onClick={(e) => e.stopPropagation()}
        className={`chunky max-h-[92dvh] w-full overflow-y-auto p-4 ${wide ? 'max-w-3xl' : 'max-w-md'}`} role="dialog" aria-label={title}>
        <div className="mb-3 flex items-center"><h3 className="text-lg font-extrabold">{title}</h3><button className="ml-auto" onClick={onClose} aria-label="Tutup"><X /></button></div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block space-y-1"><span className="text-xs font-bold text-[var(--muted)]">{label}</span>{children}{hint && <span className="block text-[11px] text-[var(--muted)]">{hint}</span>}</label>;
}

export function Confirm({ title, text, danger, label = 'Ya, lanjutkan', onYes, onClose, busy }: { title: string; text: ReactNode; danger?: boolean; label?: string; onYes: () => void; onClose: () => void; busy?: boolean }) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="text-sm">{text}</div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="btn3d rounded-xl bg-[var(--road)] px-4 py-1.5 text-sm">Batal</button>
        <button onClick={onYes} disabled={busy} className={`btn3d rounded-xl px-4 py-1.5 text-sm ${danger ? 'bg-red-400 text-slate-900' : 'bg-[var(--accent)] text-white'}`}>{busy ? 'Memproses...' : label}</button>
      </div>
    </Modal>
  );
}

export function Toast({ msg, err }: { msg: string; err?: boolean }) {
  return (
    <AnimatePresence>
      {msg && <motion.div key={msg} role="status" initial={{ y: 40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 300 }}
        className={`fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-2xl border-[3px] border-[var(--line)] px-4 py-2 text-sm font-bold shadow-lg ${err ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-900'}`}>{err ? '⚠️' : '✅'} {msg}</motion.div>}
    </AnimatePresence>
  );
}
