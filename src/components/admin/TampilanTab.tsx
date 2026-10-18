'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ImagePlus, Images, Layers, Link2, Save, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { BgKey, useTampilan } from '@/lib/tampilan';
import { bacaGambar, urlValid } from '@/lib/image';
import { setPengaturan, simpanFoto } from '@/lib/adminApi';
import { Avatar, KARAKTER, Kurir } from '../Avatar';
import { inputCls } from './ui';

type Notify = (msg: string, err?: boolean) => void;
const KB = (s: string | null | undefined) => (s ? `${Math.round(s.length / 1365)} KB` : '');

/* ------------------------------ FOTO PROFIL ------------------------------ */
function FotoProfil({ notify }: { notify: Notify }) {
  const user = useAuth((a) => a.user), setFoto = useAuth((a) => a.setFoto);
  const [tab, setTab] = useState<'karakter' | 'unggah'>(user?.foto && !user.foto.startsWith('karakter:') ? 'unggah' : 'karakter');
  const [draft, setDraft] = useState<string | null>(user?.foto ?? null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(user?.foto ?? null); }, [user?.foto]);
  if (!user) return null;
  const dirty = draft !== (user.foto ?? null);

  const pilihFile = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { setDraft(await bacaGambar(f, { w: 256, h: 256, mode: 'square', maxChars: 90000 })); } catch (e) { notify((e as Error).message, true); }
    setBusy(false);
  };
  const simpan = async (nilai: string | null) => {
    setBusy(true);
    try { await simpanFoto(user.id, nilai); setFoto(nilai); setDraft(nilai); notify(nilai ? 'Foto profil disimpan' : 'Foto profil dihapus'); } catch (e) { notify((e as Error).message, true); }
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border-2 border-[var(--road)] p-4">
      <h3 className="text-lg font-extrabold">Foto Profil Admin</h3>
      <p className="mb-3 text-sm text-[var(--muted)]">Unggah foto sendiri, atau pilih karakter kartun kurir berseragam admin.</p>
      <div className="flex flex-wrap gap-5">
        <div className="flex flex-col items-center gap-2">
          <motion.div key={draft ?? 'none'} initial={{ scale: 0.7, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 240 }}><Avatar foto={draft} nama={user.username} size={128} /></motion.div>
          <b>{user.username}</b>
          {dirty && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-slate-900">Belum disimpan</span>}
        </div>

        <div className="min-w-[18rem] flex-1 space-y-3">
          <div className="flex gap-1.5" role="tablist">
            {([['karakter', 'Pilih Karakter'], ['unggah', 'Unggah Foto']] as const).map(([id, l]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-xl border-2 px-3 py-1.5 text-sm font-bold ${tab === id ? 'border-[var(--line)] bg-[var(--accent)] text-white' : 'border-[var(--road)]'}`}>{l}</button>
            ))}
          </div>

          {tab === 'karakter' ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {KARAKTER.map((k, i) => {
                const on = draft === `karakter:${k.id}`;
                return (
                  <motion.button key={k.id} onClick={() => setDraft(`karakter:${k.id}`)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -5, scale: 1.06 }} whileTap={{ scale: 0.92 }}
                    aria-pressed={on} aria-label={`Karakter ${k.nama}`} className={`relative flex flex-col items-center gap-1 rounded-2xl border-[3px] p-1.5 ${on ? 'border-[var(--accent)] bg-acc-soft' : 'border-[var(--road)]'}`}>
                    <Kurir c={k} size={72} /><span className="text-xs font-bold">{k.nama}</span>
                    {on && <span className="absolute right-1 top-1 rounded-full bg-[var(--accent)] p-0.5 text-white"><Check size={12} /></span>}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pilihFile(e.dataTransfer.files[0]); }}
                className="flex flex-col items-center gap-2 rounded-2xl border-[3px] border-dashed border-[var(--road)] p-5 text-center">
                <ImagePlus size={28} className="text-[var(--muted)]" />
                <p className="text-sm">Seret gambar ke sini, atau</p>
                <button onClick={() => file.current?.click()} disabled={busy} className="btn3d rounded-xl bg-sky-300 px-4 py-1.5 text-sm text-slate-900">Pilih file gambar</button>
                <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { pilihFile(e.target.files?.[0]); e.target.value = ''; }} />
                <p className="text-[11px] text-[var(--muted)]">Otomatis dipotong persegi &amp; dikecilkan. {draft?.startsWith('data:') && `Ukuran: ${KB(draft)}`}</p>
              </div>
              <div className="flex gap-2">
                <input className={inputCls} placeholder="atau tempel URL gambar (https://...)" value={url} onChange={(e) => setUrl(e.target.value)} />
                <button onClick={() => { if (!urlValid(url)) return notify('URL harus diawali http:// atau https://', true); setDraft(url.trim()); setUrl(''); }} className="btn3d flex shrink-0 items-center gap-1 rounded-xl bg-[var(--road)] px-3 text-sm"><Link2 size={14} />Pakai</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button onClick={() => simpan(draft)} disabled={busy || !dirty} className="btn3d flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-1.5 text-sm text-white"><Save size={15} />{busy ? 'Menyimpan...' : 'Simpan foto'}</button>
            {dirty && <button onClick={() => setDraft(user.foto ?? null)} className="btn3d flex items-center gap-1.5 rounded-xl bg-[var(--road)] px-3 py-1.5 text-sm"><Undo2 size={15} />Batal</button>}
            {user.foto && <button onClick={() => simpan(null)} disabled={busy} className="btn3d flex items-center gap-1.5 rounded-xl bg-red-300 px-3 py-1.5 text-sm text-slate-900"><Trash2 size={15} />Hapus foto</button>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ BACKGROUND ------------------------------ */
const HAL: { key: BgKey; judul: string; form: string; btn: string; daftar?: boolean }[] = [
  { key: 'bg_login', judul: 'Login Pemain', form: 'Masuk', btn: 'Masuk' },
  { key: 'bg_register', judul: 'Daftar Pemain', form: 'Daftar', btn: 'Daftar', daftar: true },
  { key: 'bg_admin', judul: 'Login Admin', form: '🛡️ Login Admin', btn: 'Masuk sebagai Admin' },
];
const ALL: BgKey[] = HAL.map((h) => h.key);

/* Galeri bawaan: gambar SVG kecil (hanya beberapa KB), langsung bisa dipakai tanpa unggah file. */
const svg = (body: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">${body}</svg>`)}`;
const grad = (a: string, b: string) => `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#g)"/>`;
const awan = (x: number, y: number, s: number) => `<g fill="#fff" opacity=".85"><ellipse cx="${x}" cy="${y}" rx="${120 * s}" ry="${40 * s}"/><ellipse cx="${x + 80 * s}" cy="${y - 25 * s}" rx="${80 * s}" ry="${38 * s}"/><ellipse cx="${x - 70 * s}" cy="${y - 15 * s}" rx="${70 * s}" ry="${32 * s}"/></g>`;
const bintang = Array.from({ length: 70 }, (_, i) => `<circle cx="${(i * 263) % 1600}" cy="${(i * 149) % 620}" r="${1 + (i % 3)}" fill="#fff" opacity=".8"/>`).join('');
const gedung = Array.from({ length: 14 }, (_, i) => { const h = 160 + ((i * 97) % 260); return `<rect x="${i * 120}" y="${1000 - h}" width="96" height="${h}" fill="#150636"/>`; }).join('');
const GALERI: { nama: string; src: string }[] = [
  { nama: 'Langit Pagi', src: svg(grad('#8fd3ff', '#fff4d6') + awan(300, 230, 1.4) + awan(1150, 330, 1.1) + awan(800, 140, 0.8)) },
  { nama: 'Senja', src: svg(grad('#ff9a5a', '#6a3a9a') + '<circle cx="800" cy="650" r="190" fill="#ffe08a"/><ellipse cx="400" cy="1050" rx="700" ry="260" fill="#3b1f5c"/><ellipse cx="1250" cy="1060" rx="750" ry="280" fill="#2b1546"/>') },
  { nama: 'Malam Kota', src: svg(grad('#0b0221', '#3b1a7a') + bintang + gedung) },
  { nama: 'Perbukitan', src: svg(grad('#b9ecff', '#e4f8d4') + awan(350, 200, 1.2) + '<ellipse cx="300" cy="1040" rx="800" ry="360" fill="#7fd08a"/><ellipse cx="1200" cy="1060" rx="850" ry="400" fill="#4aa76a"/>') },
  { nama: 'Jalur Kurir', src: svg('<rect width="1600" height="1000" fill="#bfe6ff"/><g transform="rotate(-14 800 500)"><rect x="-300" y="400" width="2200" height="230" fill="#1b2a4a"/><line x1="-300" y1="515" x2="1900" y2="515" stroke="#ffc83d" stroke-width="12" stroke-dasharray="70 50"/></g>') },
  { nama: 'Permen', src: svg(grad('#fde4ec', '#d9ccff') + '<circle cx="250" cy="250" r="160" fill="#fff" opacity=".5"/><circle cx="1350" cy="700" r="230" fill="#fff" opacity=".45"/><circle cx="900" cy="180" r="90" fill="#fff" opacity=".5"/><circle cx="400" cy="800" r="120" fill="#fff" opacity=".4"/>') },
];

type Drafts = Partial<Record<BgKey, string | null>>; // undefined = tidak diubah, null = dihapus

function BackgroundEditor({ notify }: { notify: Notify }) {
  const { bg, muat, set } = useTampilan();
  const [mode, setMode] = useState<'semua' | 'beda'>('semua');
  const [tab, setTab] = useState<BgKey>('bg_login');
  const [drafts, setDrafts] = useState<Drafts>({});
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const init = useRef(false);

  useEffect(() => { ALL.forEach((k) => muat(k)); }, [muat]);
  const loaded = ALL.every((k) => bg[k] !== undefined);
  // pertama kali dimuat: jika ketiga halaman sudah memakai gambar sama -> mode "semua", selain itu "beda"
  useEffect(() => {
    if (!loaded || init.current) return; init.current = true;
    const v = ALL.map((k) => bg[k] ?? null); setMode(v.every((x) => x === v[0]) ? 'semua' : 'beda');
  }, [loaded, bg]);

  const cur = (k: BgKey) => bg[k] ?? null;
  const shown = (k: BgKey): string | null => (drafts[k] !== undefined ? (drafts[k] as string | null) : cur(k));
  const dirty = ALL.filter((k) => drafts[k] !== undefined && drafts[k] !== cur(k));
  const tampil = shown(tab);
  const hal = HAL.find((h) => h.key === tab)!;

  /** Satu pintu untuk semua cara memilih gambar: mode "semua" mengisi ketiga halaman sekaligus. */
  const terapkan = (v: string | null) => setDrafts((d) => (mode === 'semua' ? { bg_login: v, bg_register: v, bg_admin: v } : { ...d, [tab]: v }));
  const pilih = async (f?: File) => {
    if (!f) return; setBusy(true);
    try { terapkan(await bacaGambar(f, { w: 1600, h: 1000, mode: 'fit', maxChars: 650000 })); } catch (e) { notify((e as Error).message, true); }
    setBusy(false);
  };
  const pilihRef = useRef(pilih); pilihRef.current = pilih;
  // tempel gambar dari clipboard (Ctrl+V)
  useEffect(() => {
    const f = (e: ClipboardEvent) => { const it = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/')); const fl = it?.getAsFile(); if (fl) { e.preventDefault(); pilihRef.current(fl); } };
    window.addEventListener('paste', f); return () => window.removeEventListener('paste', f);
  }, []);

  const gantiMode = (m: 'semua' | 'beda') => {
    if (m === 'semua') { const v = shown(tab); setDrafts({ bg_login: v, bg_register: v, bg_admin: v }); }
    setMode(m);
  };
  const pakaiUrl = () => { if (!urlValid(url)) return notify('URL harus diawali http:// atau https://', true); terapkan(url.trim()); setUrl(''); };

  const simpan = async () => {
    if (!dirty.length) return; setBusy(true);
    const hasil = await Promise.allSettled(dirty.map((k) => setPengaturan(k, drafts[k] as string | null)));
    const ok: BgKey[] = []; let gagal = '';
    hasil.forEach((r, i) => { if (r.status === 'fulfilled') { ok.push(dirty[i]); set(dirty[i], drafts[dirty[i]] as string | null); } else gagal = (r.reason as Error).message; });
    setDrafts((d) => { const n = { ...d }; ok.forEach((k) => delete n[k]); return n; });
    if (gagal) notify(ok.length ? `${ok.length} halaman tersimpan, sisanya gagal: ${gagal}` : gagal, true);
    else notify(ok.length > 1 ? `Background diterapkan ke ${ok.length} halaman sekaligus` : 'Background disimpan');
    setBusy(false);
  };

  const sigKey = (v: string | null) => `${tab}-${v ? v.length + v.slice(-24) : 'kosong'}`;
  return (
    <section className="rounded-2xl border-2 border-[var(--road)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">Background Halaman Masuk</h3>
          <p className="max-w-xl text-sm text-[var(--muted)]">Pilih satu gambar, lalu sekali simpan langsung dipakai di Login Pemain, Daftar Pemain, dan Login Admin. Gambar otomatis diperkecil agar ringan.</p>
        </div>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Mode background">
          {([['semua', 'Satu untuk semua', Layers], ['beda', 'Atur per halaman', Images]] as const).map(([id, l, I]) => (
            <button key={id} role="radio" aria-checked={mode === id} onClick={() => gantiMode(id)} className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-sm font-bold ${mode === id ? 'border-[var(--line)] bg-[var(--accent)] text-white' : 'border-[var(--road)]'}`}><I size={15} />{l}</button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* ---------- pratinjau langsung ---------- */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Pratinjau halaman">
            {HAL.map((h) => {
              const t = shown(h.key), ubah = dirty.includes(h.key);
              return (
                <button key={h.key} role="tab" aria-selected={tab === h.key} onClick={() => setTab(h.key)} className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-1 text-sm font-bold ${tab === h.key ? 'border-[var(--line)] bg-acc-soft' : 'border-[var(--road)]'}`}>
                  <span className="h-6 w-9 shrink-0 rounded border border-[var(--road)] bg-[var(--road)] bg-cover bg-center" style={t ? { backgroundImage: `url(${JSON.stringify(t)})` } : undefined} />
                  {h.judul}{ubah && <span className="h-2 w-2 rounded-full bg-amber-400" title="Belum disimpan" />}
                </button>
              );
            })}
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl border-[3px] border-[var(--line)] bg-[var(--bg)]">
            <AnimatePresence>
              {tampil && <motion.div key={sigKey(tampil)} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(tampil)})` }} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} />}
            </AnimatePresence>
            {tampil && <div className="absolute inset-0 bg-black/25" />}
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 14, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.96 }} transition={{ duration: 0.2 }}
                className="absolute left-1/2 top-1/2 w-[42%] -translate-x-1/2 -translate-y-1/2 space-y-1.5 rounded-2xl bg-[var(--card)] p-3 shadow-xl">
                <div className="text-[11px] font-extrabold sm:text-sm">{hal.form}</div>
                {hal.daftar && <div className="h-3 rounded border border-[var(--road)] sm:h-4" />}
                <div className="h-3 rounded border border-[var(--road)] sm:h-4" /><div className="h-3 rounded border border-[var(--road)] sm:h-4" />
                <div className="rounded bg-[var(--accent)] py-0.5 text-center text-[8px] font-bold text-white sm:py-1 sm:text-[10px]">{hal.btn}</div>
              </motion.div>
            </AnimatePresence>
            {!tampil && <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">Default (tanpa gambar)</span>}
            {dirty.includes(tab) && <span className="absolute right-2 top-2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-slate-900">Belum disimpan {KB(tampil)}</span>}
          </div>
          <p className="text-xs text-[var(--muted)]">{mode === 'semua' ? 'Mode satu untuk semua: gambar yang Anda pilih langsung muncul di ketiga halaman. Klik tab di atas untuk melihat tiap halaman.' : `Mode per halaman: perubahan hanya untuk “${hal.judul}”. Pilih tab lain untuk mengatur halaman itu.`}</p>
        </div>

        {/* ---------- kontrol ---------- */}
        <div className="space-y-3">
          <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); pilih(e.dataTransfer.files[0]); }}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-[3px] border-dashed p-4 text-center transition-all ${over ? 'scale-[1.02] border-[var(--accent)] bg-acc-soft' : 'border-[var(--road)]'}`}>
            <motion.div animate={over ? { y: [0, -6, 0] } : { y: 0 }} transition={{ repeat: over ? Infinity : 0, duration: 0.7 }}><ImagePlus size={28} className="text-[var(--muted)]" /></motion.div>
            <p className="text-sm font-bold">{over ? 'Lepaskan gambar di sini' : 'Seret gambar ke sini'}</p>
            <button onClick={() => file.current?.click()} disabled={busy} className="btn3d rounded-xl bg-sky-300 px-4 py-1.5 text-sm text-slate-900">{busy ? 'Memproses...' : 'Pilih file gambar'}</button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { pilih(e.target.files?.[0]); e.target.value = ''; }} />
            <p className="text-[11px] text-[var(--muted)]">atau tekan Ctrl+V untuk menempel gambar dari clipboard</p>
          </div>
          <div className="flex gap-1.5">
            <input className={inputCls} placeholder="atau URL gambar https://..." value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && pakaiUrl()} />
            <button onClick={pakaiUrl} className="btn3d flex shrink-0 items-center gap-1 rounded-xl bg-[var(--road)] px-3 text-sm"><Link2 size={14} />Pakai</button>
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold"><Sparkles size={14} />Galeri bawaan</p>
            <div className="grid grid-cols-3 gap-2">
              {GALERI.map((g, i) => {
                const on = tampil === g.src;
                return (
                  <motion.button key={g.nama} onClick={() => terapkan(g.src)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -3, scale: 1.05 }} whileTap={{ scale: 0.94 }} aria-pressed={on} aria-label={`Background ${g.nama}`}
                    className={`relative aspect-video overflow-hidden rounded-xl border-[3px] bg-cover bg-center ${on ? 'border-[var(--accent)]' : 'border-[var(--road)]'}`} style={{ backgroundImage: `url(${JSON.stringify(g.src)})` }}>
                    <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-[10px] font-bold text-white">{g.nama}</span>
                    {on && <span className="absolute right-1 top-1 rounded-full bg-[var(--accent)] p-0.5 text-white"><Check size={11} /></span>}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <motion.button onClick={simpan} disabled={busy || !dirty.length} whileTap={{ scale: 0.96 }} className="btn3d flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-1.5 text-sm text-white">
              <Save size={15} />{busy ? 'Menyimpan...' : dirty.length > 1 ? `Simpan & terapkan ke ${dirty.length} halaman` : 'Simpan'}
            </motion.button>
            {dirty.length > 0 && <button onClick={() => setDrafts({})} className="btn3d flex items-center gap-1.5 rounded-xl bg-[var(--road)] px-3 py-1.5 text-sm"><Undo2 size={15} />Batal</button>}
            {tampil && <button onClick={() => terapkan(null)} disabled={busy} className="btn3d flex items-center gap-1.5 rounded-xl bg-red-300 px-3 py-1.5 text-sm text-slate-900"><Trash2 size={15} />{mode === 'semua' ? 'Hapus dari semua' : 'Hapus'}</button>}
          </div>
          {!loaded && <p className="text-xs text-[var(--muted)]">Memuat background tersimpan...</p>}
        </div>
      </div>
    </section>
  );
}

export function TampilanTab({ notify }: { notify: Notify }) {
  return (
    <div className="space-y-4">
      <FotoProfil notify={notify} />
      <BackgroundEditor notify={notify} />
    </div>
  );
}
