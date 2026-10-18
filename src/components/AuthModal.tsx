'use client';
import { useState } from 'react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { BgKey, useTampilan } from '@/lib/tampilan';

type Mode = 'login' | 'register' | 'admin' | 'adminReg';

export function AuthModal({ onClose }: { onClose?: () => void }) {
  const { signIn, signUp, signInAdmin, fail, error, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [f, setF] = useState({ email: '', pw: '', username: '', code: '' });
  const [info, setInfo] = useState('');
  const input = 'w-full rounded-xl border-2 border-[var(--road)] bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]';
  const go = (m: Mode) => { setMode(m); setInfo(''); fail(''); };
  const reg = mode === 'register' || mode === 'adminReg';
  // background hanya untuk halaman gerbang (tanpa onClose); tiap mode punya gambar sendiri
  const gate = !onClose;
  const bgKey: BgKey = ({ login: 'bg_login', register: 'bg_register', admin: 'bg_admin', adminReg: 'bg_admin' } as const)[mode];
  const muat = useTampilan((t) => t.muat), bgUrl = useTampilan((t) => t.bg[bgKey]);
  useEffect(() => { if (gate) muat(bgKey); }, [gate, bgKey, muat]);

  async function submit() {
    if (mode === 'admin') {
      // peran dicek di database; jika admin, halaman otomatis berpindah ke dashboard (tanpa membuka game)
      if (await signInAdmin(f.email, f.pw)) onClose?.();
    } else if (mode === 'adminReg') {
      if (await signUp(f.email, f.pw, f.username, f.code)) {
        // jika langsung masuk (tanpa konfirmasi email), halaman otomatis berpindah ke dashboard
        setInfo('Akun admin dibuat! Jika diminta, konfirmasi email dulu, lalu masuk lewat Login Admin.');
        setMode('admin');
      }
    } else if (mode === 'login') { if (await signIn(f.email, f.pw)) onClose?.(); }
    else if (await signUp(f.email, f.pw, f.username)) { setInfo('Akun dibuat! Cek email untuk konfirmasi (jika diaktifkan), lalu masuk.'); setMode('login'); }
  }

  const title = { login: 'Masuk', register: 'Daftar', admin: '🛡️ Login Admin', adminReg: '🛡️ Daftar Admin' }[mode];
  const btn = { login: 'Masuk', register: 'Daftar', admin: 'Masuk sebagai Admin', adminReg: 'Daftar sebagai Admin' }[mode];
  const link = 'w-full text-sm text-[var(--muted)] underline';
  const box = 'w-full rounded-xl border-2 border-[var(--road)] py-1.5 text-sm font-bold';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => onClose?.()}>
      {gate && (
        <AnimatePresence>
          {bgUrl && <motion.div key={bgUrl.slice(-40) + bgUrl.length} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(bgUrl)})` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />}
        </AnimatePresence>
      )}
      {gate && bgUrl && <div className="absolute inset-0 bg-black/25" />}
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm space-y-3 rounded-3xl bg-[var(--card)] p-5 shadow-2xl" style={gate && bgUrl ? { background: 'color-mix(in srgb, var(--card) 93%, transparent)', backdropFilter: 'blur(8px)' } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{title}</h2>
          {onClose && <button onClick={onClose} aria-label="Tutup"><X /></button>}
        </div>
        {reg && <input className={input} placeholder="Username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />}
        <input className={input} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className={input} type="password" placeholder="Password (min. 6 karakter)" value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} />
        {mode === 'adminReg' && <input className={input} placeholder="Kode admin (dari pemilik database)" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />}
        {reg && <p className="text-xs text-[var(--muted)]">Pakai password baru yang mudah diingat. Jangan pakai password akun lain.</p>}
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        {info && <p className="text-sm font-bold text-emerald-600">{info}</p>}
        <button onClick={submit} disabled={loading} className="w-full rounded-xl bg-[var(--accent)] py-2 font-bold text-white disabled:opacity-50">
          {loading ? 'Memproses...' : btn}
        </button>
        {mode === 'login' && <button className={link} onClick={() => go('register')}>Belum punya akun? Daftar</button>}
        {mode === 'register' && <button className={link} onClick={() => go('login')}>Sudah punya akun? Masuk</button>}
        {mode === 'admin' && <button className={link} onClick={() => go('adminReg')}>Belum punya akun admin? Daftar Admin</button>}
        {mode === 'adminReg' && <button className={link} onClick={() => go('admin')}>Sudah punya akun admin? Login Admin</button>}
        <button className={box} onClick={() => go(mode === 'admin' || mode === 'adminReg' ? 'login' : 'admin')}>
          {mode === 'admin' || mode === 'adminReg' ? '← Kembali ke login pemain' : '🛡️ Login Admin'}
        </button>
      </motion.div>
    </div>
  );
}
