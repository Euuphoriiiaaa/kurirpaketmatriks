'use client';
import { useCallback, useEffect, useState } from 'react';
import { KeyRound, RefreshCw } from 'lucide-react';
import { LogRow, fetchLog, gantiKode, tgl } from '@/lib/adminApi';
import { Field, inputCls } from './ui';

const NAMA: Record<string, string> = {
  ubah_pemain: '✏️ Ubah data pemain', hapus_pemain: '🗑️ Hapus pemain', set_progres: '⭐ Atur progres level', reset_progres: '♻️ Reset progres',
  jadikan_admin: '🛡️ Jadikan admin', cabut_admin: '🚫 Cabut admin', ganti_kode_admin: '🔑 Ganti kode admin', set_pengaturan: '🖼️ Ubah background',
};

export function LogTab({ notify }: { notify: (m: string, e?: boolean) => void }) {
  const [log, setLog] = useState<LogRow[]>([]);
  const [err, setErr] = useState('');
  const [kode, setKode] = useState('');
  const load = useCallback(async () => { try { setLog(await fetchLog()); setErr(''); } catch (e) { setErr((e as Error).message); } }, []);
  useEffect(() => { load(); }, [load]);
  const simpan = async () => {
    try { await gantiKode(kode); notify('Kode admin diganti'); setKode(''); load(); } catch (e) { notify((e as Error).message, true); }
  };
  return (
    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_18rem]">
      <section className="flex min-h-0 flex-col rounded-2xl border-2 border-[var(--road)] p-3">
        <div className="mb-2 flex items-center"><h4 className="font-extrabold">Log aktivitas admin</h4><button onClick={load} className="ml-auto rounded-lg p-1.5 hover:bg-[var(--road)]" aria-label="Muat ulang log"><RefreshCw size={16} /></button></div>
        {err && <p className="rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-700">{err}</p>}
        <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto text-sm">
          {log.map((l) => (
            <li key={l.id} className="rounded-xl bg-[var(--road)] px-3 py-2">
              <b>{NAMA[l.aksi] ?? l.aksi}</b>{l.target_nama && <> · <span className="font-bold">{l.target_nama}</span></>}{l.detail && <span className="text-[var(--muted)]"> ({l.detail})</span>}
              <div className="text-xs text-[var(--muted)]">oleh {l.admin_nama ?? 'admin'} · {tgl(l.waktu)}</div>
            </li>
          ))}
          {!err && log.length === 0 && <li className="py-6 text-center text-[var(--muted)]">Belum ada aktivitas tercatat.</li>}
        </ul>
      </section>
      <section className="space-y-2 self-start rounded-2xl border-2 border-[var(--road)] p-3">
        <h4 className="flex items-center gap-1.5 font-extrabold"><KeyRound size={16} />Kode pendaftaran admin</h4>
        <Field label="Kode baru" hint="Dipakai di form Daftar Admin. Minimal 6 karakter."><input className={inputCls} value={kode} onChange={(e) => setKode(e.target.value)} placeholder="mis. ADM-KELAS-XI" /></Field>
        <button onClick={simpan} disabled={kode.trim().length < 6} className="btn3d w-full rounded-xl bg-[var(--accent)] py-1.5 text-sm text-white">Ganti kode</button>
      </section>
    </div>
  );
}
