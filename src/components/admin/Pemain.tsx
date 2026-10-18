'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Copy, Download, Eye, EyeOff, Pencil, Plus, RotateCcw, Search, ShieldCheck, ShieldOff, Trash2, UserPlus } from 'lucide-react';
import { LEVELS } from '@/lib/levels';
import { Row, aturRole, hapusPemain, levelTerbuka, persenSelesai, resetProgres, setProgres, sejak, sum, tambahPemain, terakhirMain, tgl, ubahPemain, unduhCsv } from '@/lib/adminApi';
import { Bar, Confirm, Field, Modal, Stars, inputCls, thCls } from './ui';
import type { Preset } from './types';
import { Avatar } from '../Avatar';

type Notify = (msg: string, err?: boolean) => void;
type Sort = NonNullable<Preset['sort']>;
const PER = 10;

export function Pemain({ rows, me, q, setQ, reload, notify, loading, preset }: { rows: Row[]; me?: string; q: string; setQ: (v: string) => void; reload: () => Promise<void>; notify: Notify; loading: boolean; preset: Preset & { n: number } }) {
  const [role, setRole] = useState<NonNullable<Preset['role']>>(preset.role ?? 'semua');
  const [status, setStatus] = useState<NonNullable<Preset['status']>>(preset.status ?? 'semua');
  const [sort, setSort] = useState<Sort>(preset.sort ?? 'baru');
  const [showPw, setShowPw] = useState(false);
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [view, setView] = useState<string | null>(null);
  const [form, setForm] = useState<{ mode: 'add' } | { mode: 'edit'; r: Row } | null>(null);
  const [prog, setProg] = useState<{ r: Row; level: number } | null>(null);
  const [ask, setAsk] = useState<{ title: string; text: React.ReactNode; danger?: boolean; fn: () => Promise<void> } | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    let a = rows.filter((r) => (!k || `${r.nama} ${r.surel}`.toLowerCase().includes(k))
      && (role === 'semua' || (role === 'admin') === r.adm)
      && (status === 'semua' || (status === 'belum' ? r.progres.length === 0 : status === 'tamat' ? r.progres.some((p) => p.level === LEVELS.length) : r.progres.length > 0 && !r.progres.some((p) => p.level === LEVELS.length))));
    const by: Record<Sort, (x: Row, y: Row) => number> = {
      baru: (x, y) => +new Date(y.daftar_pada) - +new Date(x.daftar_pada), nama: (x, y) => (x.nama ?? '').localeCompare(y.nama ?? ''),
      skor: (x, y) => sum(y, 'score') - sum(x, 'score'), level: (x, y) => y.progres.length - x.progres.length,
      aktif: (x, y) => +new Date(terakhirMain(y) ?? y.login_terakhir ?? 0) - +new Date(terakhirMain(x) ?? x.login_terakhir ?? 0),
    };
    return a.sort(by[sort]);
  }, [rows, q, role, status, sort]);
  useEffect(() => { setRole(preset.role ?? 'semua'); setStatus(preset.status ?? 'semua'); setSort(preset.sort ?? 'baru'); }, [preset]);
  useEffect(() => setPage(1), [q, role, status, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PER)), cur = list.slice((page - 1) * PER, page * PER);
  const viewRow = rows.find((r) => r.uid === view) ?? null;
  const picked = rows.filter((r) => sel.has(r.uid));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOnPage = cur.length > 0 && cur.every((r) => sel.has(r.uid));
  const nm = (r: Row) => r.nama ?? r.surel ?? 'pemain';

  const exec = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try { await fn(); notify(ok); await reload(); setAsk(null); } catch (e) { notify((e as Error).message, true); setAsk(null); }
    setBusy(false);
  };
  const delOne = (r: Row) => setAsk({ title: 'Hapus pemain?', danger: true, text: <>Akun <b>{nm(r)}</b> beserta seluruh progres levelnya akan dihapus permanen dan tidak bisa dikembalikan.</>, fn: async () => hapusPemain(r.uid) });
  const resetAll = (r: Row) => setAsk({ title: 'Reset semua progres?', danger: true, text: <>Seluruh bintang, skor, dan level <b>{nm(r)}</b> akan dikosongkan. Akunnya tetap ada.</>, fn: async () => resetProgres(r.uid, null) });
  const roleToggle = (r: Row) => setAsk({ title: r.adm ? 'Cabut status admin?' : 'Jadikan admin?', text: <><b>{nm(r)}</b> {r.adm ? 'tidak akan bisa lagi membuka dashboard ini.' : 'akan mendapat akses penuh ke dashboard admin.'}</>, fn: async () => aturRole(r.uid, !r.adm) });
  const bulkDelete = () => setAsk({ title: `Hapus ${picked.length} pemain?`, danger: true, text: <>Semua akun terpilih dan progresnya dihapus permanen. Akun Anda sendiri otomatis dilewati.</>, fn: async () => { for (const r of picked) if (r.uid !== me) await hapusPemain(r.uid); setSel(new Set()); } });
  const bulkReset = () => setAsk({ title: `Reset progres ${picked.length} pemain?`, danger: true, text: <>Seluruh progres level pemain terpilih dikosongkan.</>, fn: async () => { for (const r of picked) await resetProgres(r.uid, null); setSel(new Set()); } });

  const sel1 = 'rounded-xl border-2 border-[var(--road)] bg-[var(--card)] px-2 py-1.5 text-sm';
  const ib = 'rounded-lg p-1.5 transition-transform hover:scale-125 hover:bg-[var(--road)] active:scale-90';
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--road)] px-2 py-1.5"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari username / email" className="w-44 bg-transparent text-sm outline-none" /></label>
        <select className={sel1} value={role} onChange={(e) => setRole(e.target.value as typeof role)} aria-label="Filter role"><option value="semua">Semua role</option><option value="pemain">Pemain</option><option value="admin">Admin</option></select>
        <select className={sel1} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter status"><option value="semua">Semua status</option><option value="belum">Belum main</option><option value="main">Sedang bermain</option><option value="tamat">Tamat Level 10</option></select>
        <select className={sel1} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Urutkan"><option value="baru">Terbaru daftar</option><option value="aktif">Paling aktif</option><option value="skor">Skor tertinggi</option><option value="level">Level terjauh</option><option value="nama">Nama A–Z</option></select>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setShowPw((v) => !v)} className="btn3d flex items-center gap-1 rounded-xl bg-[var(--road)] px-3 py-1.5 text-sm">{showPw ? <EyeOff size={15} /> : <Eye size={15} />}Password</button>
          <button onClick={() => unduhCsv(list, showPw)} className="btn3d flex items-center gap-1 rounded-xl bg-sky-300 px-3 py-1.5 text-sm text-slate-900"><Download size={15} />CSV</button>
          <button onClick={() => setForm({ mode: 'add' })} className="btn3d flex items-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-sm text-white"><UserPlus size={15} />Tambah</button>
        </div>
      </div>

      {sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-200 px-3 py-1.5 text-sm font-bold text-slate-900">
          {sel.size} dipilih
          <button onClick={bulkReset} className="ml-auto flex items-center gap-1 rounded-lg bg-white/70 px-2 py-1"><RotateCcw size={14} />Reset progres</button>
          <button onClick={bulkDelete} className="flex items-center gap-1 rounded-lg bg-red-400 px-2 py-1"><Trash2 size={14} />Hapus</button>
          <button onClick={() => setSel(new Set())} className="underline">Batal</button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border-2 border-[var(--road)]">
        <table className="w-full min-w-[60rem] text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--card)]"><tr className="border-b-2 border-[var(--road)]">
            <th className="w-8 px-3 py-2"><input type="checkbox" checked={allOnPage} onChange={() => setSel((s) => { const n = new Set(s); cur.forEach((r) => (allOnPage ? n.delete(r.uid) : n.add(r.uid))); return n; })} aria-label="Pilih semua di halaman" /></th>
            <th className={thCls}>Pemain</th>{showPw && <th className={thCls}>Password</th>}<th className={thCls}>Role</th><th className={thCls}>Progres level</th><th className={thCls}>⭐</th><th className={thCls}>Skor</th><th className={thCls}>Aktivitas</th><th className={`${thCls} text-right`}>Aksi</th>
          </tr></thead>
          <tbody>
            {cur.map((r, i) => (
              <motion.tr key={r.uid} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }} onClick={() => setView(r.uid)}
                className="cursor-pointer border-b border-[var(--road)] transition-colors hv-row">
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(r.uid)} onChange={() => toggle(r.uid)} aria-label={`Pilih ${nm(r)}`} /></td>
                <td className="px-3 py-2"><div className="flex items-center gap-2 text-left">
                  <Avatar foto={r.foto} nama={r.nama} size={34} />
                  <span><b className="block leading-tight">{r.nama ?? '-'}{r.uid === me && <span className="ml-1 text-[10px] font-normal text-[var(--muted)]">(Anda)</span>}</b><span className="text-xs text-[var(--muted)]">{r.surel ?? '-'}</span></span></div></td>
                {showPw && <td className="px-3 py-2 font-mono text-xs">{r.sandi ?? <span className="text-[var(--muted)]">tidak tersimpan</span>}</td>}
                <td className="px-3 py-2">{r.adm ? <span className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-slate-900">Admin</span> : <span className="text-xs text-[var(--muted)]">Pemain</span>}</td>
                <td className="w-40 px-3 py-2"><div className="flex items-center gap-2"><Bar value={persenSelesai(r)} h={8} /><span className="w-10 shrink-0 text-xs font-bold">{r.progres.length}/{LEVELS.length}</span></div></td>
                <td className="px-3 py-2">{sum(r, 'stars')}</td><td className="px-3 py-2">{sum(r, 'score')}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--muted)]">{sejak(terakhirMain(r) ?? r.login_terakhir)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <button className={ib} title="Lihat detail" onClick={() => setView(r.uid)}><Eye size={16} /></button>
                  <button className={ib} title="Edit" onClick={() => setForm({ mode: 'edit', r })}><Pencil size={16} /></button>
                  {r.uid !== me && <button className={ib} title={r.adm ? 'Cabut admin' : 'Jadikan admin'} onClick={() => roleToggle(r)}>{r.adm ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}</button>}
                  <button className={ib} title="Reset progres" onClick={() => resetAll(r)}><RotateCcw size={16} /></button>
                  {r.uid !== me && <button className={`${ib} text-red-500`} title="Hapus" onClick={() => delOne(r)}><Trash2 size={16} /></button>}
                </td>
              </motion.tr>
            ))}
            {!loading && cur.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-[var(--muted)]">Tidak ada pemain yang cocok.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span>{list.length} dari {rows.length} akun</span>
        <div className="ml-auto flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg p-1 hover:bg-[var(--road)] disabled:opacity-30" aria-label="Sebelumnya"><ChevronLeft size={16} /></button>
          <span className="font-bold text-[var(--ink)]">{page}/{pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg p-1 hover:bg-[var(--road)] disabled:opacity-30" aria-label="Berikutnya"><ChevronRight size={16} /></button>
        </div>
      </div>

      {viewRow && (
        <Modal title={`Detail: ${nm(viewRow)}`} wide onClose={() => setView(null)}>
          <div className="mb-3 flex items-center gap-3"><Avatar foto={viewRow.foto} nama={viewRow.nama} size={64} /><div><b className="text-lg">{nm(viewRow)}</b>{viewRow.adm && <span className="ml-2 rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-slate-900">Admin</span>}<div className="text-xs text-[var(--muted)]">{viewRow.surel}</div></div></div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-[var(--road)] p-3"><div className="text-xs text-[var(--muted)]">Email</div><b>{viewRow.surel}</b></div>
            <div className="rounded-xl bg-[var(--road)] p-3"><div className="text-xs text-[var(--muted)]">Password</div>
              {viewRow.sandi ? <span className="flex items-center gap-2 font-mono"><b>{showPw ? viewRow.sandi : '••••••••'}</b>
                <button onClick={() => setShowPw((v) => !v)} aria-label="Tampilkan password">{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                <button onClick={() => { navigator.clipboard?.writeText(viewRow.sandi!); notify('Password disalin'); }} aria-label="Salin password"><Copy size={14} /></button></span> : <span className="text-[var(--muted)]">tidak tersimpan</span>}</div>
            <div className="rounded-xl bg-[var(--road)] p-3"><div className="text-xs text-[var(--muted)]">Terdaftar · Login terakhir</div>{tgl(viewRow.daftar_pada)} · {tgl(viewRow.login_terakhir)}</div>
            <div className="rounded-xl bg-[var(--road)] p-3"><div className="text-xs text-[var(--muted)]">Ringkasan</div><b>{viewRow.progres.length}/{LEVELS.length}</b> level · <b>{sum(viewRow, 'stars')}</b>⭐ · <b>{sum(viewRow, 'score')}</b> poin · {sum(viewRow, 'lines')} baris kode</div>
          </div>
          <div className="mb-2 mt-3 flex items-center"><h4 className="font-extrabold">Progres per level</h4><span className="ml-2 text-xs text-[var(--muted)]">Level terbuka berikutnya: {levelTerbuka(viewRow)}</span>
            <button onClick={() => setProg({ r: viewRow, level: levelTerbuka(viewRow) })} className="btn3d ml-auto flex items-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-1 text-xs text-white"><Plus size={14} />Tambah / ubah</button></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {LEVELS.map((l, i) => {
              const p = viewRow.progres.find((x) => x.level === l.id);
              return (
                <motion.div key={l.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -3 }} className={`rounded-xl border-2 p-2 text-xs ${p ? 'border-emerald-400 bg-emerald-400/10' : 'border-[var(--road)] opacity-70'}`}>
                  <div className="flex items-center justify-between"><b>Level {l.id}</b>{p && <Stars n={p.stars} size={11} />}</div>
                  <div className="truncate text-[var(--muted)]">{l.title.split(': ')[1]}</div>
                  {p ? <>
                    <div className="mt-1">Skor <b>{p.score}</b> · {p.lines}/{l.maxLines} baris</div>
                    <div className="text-[var(--muted)]">{sejak(p.updated)}</div>
                    <div className="mt-1 flex gap-1">
                      <button onClick={() => setProg({ r: viewRow, level: l.id })} className="rounded-md bg-[var(--road)] p-1" aria-label={`Ubah level ${l.id}`}><Pencil size={12} /></button>
                      <button onClick={() => setAsk({ title: `Reset Level ${l.id}?`, danger: true, text: <>Progres Level {l.id} milik <b>{nm(viewRow)}</b> dihapus.</>, fn: async () => resetProgres(viewRow.uid, l.id) })} className="rounded-md bg-[var(--road)] p-1 text-red-500" aria-label={`Reset level ${l.id}`}><RotateCcw size={12} /></button>
                    </div></> : <div className="mt-1 text-[var(--muted)]">Belum selesai</div>}
                </motion.div>
              );
            })}
          </div>
        </Modal>
      )}

      {form && <PlayerForm key={form.mode === 'edit' ? form.r.uid : 'add'} state={form} onClose={() => setForm(null)} onDone={async (m) => { setForm(null); notify(m); await reload(); }} notify={notify} />}
      {prog && <ProgressForm key={`${prog.r.uid}-${prog.level}`} r={prog.r} level={prog.level} onClose={() => setProg(null)} onDone={async () => { setProg(null); notify('Progres disimpan'); await reload(); }} notify={notify} />}
      {ask && <Confirm title={ask.title} text={ask.text} danger={ask.danger} busy={busy} onClose={() => setAsk(null)} onYes={() => exec(ask.fn, 'Berhasil')} />}
    </div>
  );
}

function PlayerForm({ state, onClose, onDone, notify }: { state: { mode: 'add' } | { mode: 'edit'; r: Row }; onClose: () => void; onDone: (m: string) => void; notify: Notify }) {
  const edit = state.mode === 'edit' ? state.r : null;
  const [f, setF] = useState({ nama: edit?.nama ?? '', surel: edit?.surel ?? '', sandi: '', admin: false });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!f.nama.trim() || !f.surel.trim()) return notify('Username dan email wajib diisi', true);
    if (!edit && f.sandi.length < 6) return notify('Password minimal 6 karakter', true);
    if (f.sandi && f.sandi.length < 6) return notify('Password minimal 6 karakter', true);
    setBusy(true);
    try {
      if (edit) await ubahPemain(edit.uid, { nama: f.nama !== edit.nama ? f.nama : undefined, surel: f.surel !== edit.surel ? f.surel : undefined, sandi: f.sandi || undefined });
      else await tambahPemain({ nama: f.nama.trim(), surel: f.surel.trim(), sandi: f.sandi, admin: f.admin });
      onDone(edit ? 'Data pemain diperbarui' : 'Pemain ditambahkan');
    } catch (e) { notify((e as Error).message, true); setBusy(false); }
  };
  return (
    <Modal title={edit ? `Edit ${edit.nama}` : 'Tambah pemain'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Username"><input className={inputCls} value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></Field>
        <Field label="Email"><input className={inputCls} type="email" value={f.surel} onChange={(e) => setF({ ...f, surel: e.target.value })} /></Field>
        <Field label={edit ? 'Password baru' : 'Password'} hint={edit ? 'Kosongkan jika tidak ingin mengubah password.' : 'Minimal 6 karakter.'}><input className={inputCls} value={f.sandi} onChange={(e) => setF({ ...f, sandi: e.target.value })} /></Field>
        {!edit && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.admin} onChange={(e) => setF({ ...f, admin: e.target.checked })} />Jadikan admin</label>}
        {!edit && <p className="text-[11px] text-[var(--muted)]">Jika konfirmasi email aktif di Supabase, pemain baru harus konfirmasi dulu sebelum bisa masuk.</p>}
        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn3d rounded-xl bg-[var(--road)] px-4 py-1.5 text-sm">Batal</button>
          <button onClick={save} disabled={busy} className="btn3d rounded-xl bg-[var(--accent)] px-4 py-1.5 text-sm text-white">{busy ? 'Menyimpan...' : 'Simpan'}</button></div>
      </div>
    </Modal>
  );
}

function ProgressForm({ r, level, onClose, onDone, notify }: { r: Row; level: number; onClose: () => void; onDone: () => void; notify: Notify }) {
  const pick = (lv: number) => r.progres.find((p) => p.level === lv);
  const [lv, setLv] = useState(level);
  const [f, setF] = useState({ bintang: pick(level)?.stars ?? 1, skor: pick(level)?.score ?? 0, baris: pick(level)?.lines ?? 0 });
  const [busy, setBusy] = useState(false);
  const change = (n: number) => { setLv(n); const p = pick(n); setF({ bintang: p?.stars ?? 1, skor: p?.score ?? 0, baris: p?.lines ?? 0 }); };
  const L = LEVELS[lv - 1];
  const save = async () => {
    setBusy(true);
    try { await setProgres(r.uid, lv, f.bintang, f.skor, f.baris); onDone(); } catch (e) { notify((e as Error).message, true); setBusy(false); }
  };
  return (
    <Modal title={`Progres ${r.nama}`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Level"><select className={inputCls} value={lv} onChange={(e) => change(+e.target.value)}>{LEVELS.map((l) => <option key={l.id} value={l.id}>Level {l.id} — {l.title.split(': ')[1]}{pick(l.id) ? ' (sudah selesai)' : ''}</option>)}</select></Field>
        <Field label="Bintang"><div className="flex gap-2">{[1, 2, 3].map((n) => <button key={n} onClick={() => setF({ ...f, bintang: n })} className={`btn3d flex-1 rounded-xl py-1.5 text-sm ${f.bintang === n ? 'bg-yellow-300 text-slate-900' : 'bg-[var(--road)]'}`}>{n} ⭐</button>)}</div></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Skor"><input className={inputCls} type="number" min={0} value={f.skor} onChange={(e) => setF({ ...f, skor: +e.target.value })} /></Field>
          <Field label="Jumlah baris" hint={`Target ⭐3 ≤ ${L.stars.three}, ⭐2 ≤ ${L.stars.two}, maks ${L.maxLines}`}><input className={inputCls} type="number" min={0} value={f.baris} onChange={(e) => setF({ ...f, baris: +e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn3d rounded-xl bg-[var(--road)] px-4 py-1.5 text-sm">Batal</button>
          <button onClick={save} disabled={busy} className="btn3d rounded-xl bg-[var(--accent)] px-4 py-1.5 text-sm text-white">{busy ? 'Menyimpan...' : 'Simpan'}</button></div>
      </div>
    </Modal>
  );
}
