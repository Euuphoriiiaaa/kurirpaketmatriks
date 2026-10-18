'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type St = 'checking' | 'ok' | 'error' | 'guest';
const LOOK: Record<St, { dot: string; text: string; tip: string }> = {
  checking: { dot: 'bg-amber-400 animate-pulse', text: 'Memeriksa...', tip: 'Sedang memeriksa koneksi database' },
  ok: { dot: 'bg-emerald-500', text: 'Terhubung ke database', tip: 'Progres kamu tersimpan di database' },
  error: { dot: 'bg-red-500', text: 'Gagal terhubung', tip: 'Database tidak bisa dihubungi. Cek internet atau pengaturan Supabase.' },
  guest: { dot: 'bg-slate-400', text: 'Mode tamu', tip: 'Belum terhubung ke database (kunci Supabase belum diisi)' },
};

/** Lencana kecil yang memeriksa koneksi ke Supabase secara berkala. */
export function DbBadge() {
  const [st, setSt] = useState<St>(supabase ? 'checking' : 'guest');

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const check = async () => {
      // head-request ringan; tanpa error = server dan tabel bisa dijangkau
      const { error } = await supabase!.from('kpm_pemain_profil').select('id', { head: true, count: 'exact' });
      if (alive) setSt(error ? 'error' : 'ok');
    };
    check();
    const t = setInterval(check, 30000);
    window.addEventListener('online', check);
    return () => { alive = false; clearInterval(t); window.removeEventListener('online', check); };
  }, []);

  const l = LOOK[st];
  return (
    <span title={l.tip} className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--card)] px-2.5 py-1 text-xs font-bold">
      <i className={`h-2.5 w-2.5 rounded-full ${l.dot}`} />
      <span className="hidden sm:inline">{l.text}</span>
    </span>
  );
}
