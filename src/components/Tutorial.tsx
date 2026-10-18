'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useSettings } from '@/store/settingsStore';

// `say` = teks yang tampil di layar. Suara memakai rekaman /audio/stepN.mp3 (sudah dibersihkan dari noise).
// Bahasa dibuat sederhana, kalimat pendek, supaya mudah dipahami anak SD.
const STEPS = [
  { icon: '👋', audio: '/audio/step1.mp3', title: 'Halo, Kurir Hebat!', code: '',
    say: 'Halo, teman-teman! Aku Kak Kurir. Hari ini kalian jadi kurir yang mengantar paket. Kalian akan menyetir truk dengan menulis perintah. Seru, kan? Ayo kita belajar bersama!' },
  { icon: '🗺️', audio: '/audio/step2.mp3', title: 'Kenali petanya', code: '',
    say: 'Ini petanya. Truk mulai dari depot. Lalu truk mengambil paket. Setelah itu, antar paketnya ke rumah tujuan. Awas, jangan menabrak tanda macet ya! Setiap kotak punya nama. Huruf B artinya baris, yaitu ke samping. Huruf K artinya kolom, yaitu ke bawah.' },
  { icon: '⌨️', audio: '/audio/step3.mp3', title: 'Perintah untuk truk', code: 'MAJU\nMUNDUR\nBELOK KANAN\nBELOK KIRI\nBALIK ARAH\nAMBIL\nSERAH',
    say: 'Ini perintah untuk truk. Maju, artinya truk jalan ke depan. Mundur, artinya truk jalan ke belakang. Belok kanan dan belok kiri, untuk memutar truk. Ambil, untuk mengambil paket. Serah, untuk memberikan paket di rumah tujuan. Tulis satu perintah di satu baris, ya.' },
  { icon: '🔁', audio: '/audio/step4.mp3', title: 'Pakai ulangi supaya singkat', code: 'ULANGI 3 {\n  MAJU\n}',
    say: 'Kalau perintahnya sama berkali-kali, kita pakai ulangi. Contohnya, ulangi tiga kali maju. Itu sama saja dengan menulis maju, maju, maju. Tulisannya jadi lebih pendek, dan bintangmu bisa lebih banyak!' },
  { icon: '⭐', audio: '/audio/step5.mp3', title: 'Cara bermain', code: '',
    say: 'Cara bermainnya mudah. Tulis perintahmu, lalu tekan tombol jalankan. Truk akan mengikuti perintahmu. Waktu mulai jalan saat kamu mengetik, jadi kerjakan dengan cepat dan hemat. Kalau salah, tidak apa-apa. Perbaiki lalu coba lagi. Selamat bermain, kurir hebat!' },
];

// Perkiraan lama baca (ms) dipakai saat suara mati / tidak didukung browser.
const readTime = (t: string) => Math.max(4000, t.length * 70);
const GAP = 1500; // jeda sebelum pindah ke langkah berikutnya

export function Tutorial({ onClose }: { onClose: () => void }) {
  const set = useSettings((s) => s.set);
  const [sound, setSound] = useState(true);
  const [playing, setPlaying] = useState(true); // langsung jalan otomatis
  const [i, setI] = useState(0);
  const step = STEPS[i], last = i === STEPS.length - 1;
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const audio = useRef<HTMLAudioElement>();
  const halt = () => { clearTimeout(timer.current); if (audio.current) { audio.current.onended = null; audio.current.onerror = null; audio.current.pause(); audio.current = undefined; } };
  useEffect(() => halt, []);

  // Satu efek mengatur rekaman suara + pindah otomatis ke langkah berikutnya.
  useEffect(() => {
    halt();
    if (!playing) return;
    const next = () => { timer.current = setTimeout(() => (last ? setPlaying(false) : setI((n) => n + 1)), GAP); };
    const byTimer = () => { timer.current = setTimeout(next, readTime(step.say)); };
    if (sound) {
      const a = new Audio(step.audio);
      audio.current = a;
      a.onended = next;
      a.onerror = byTimer;
      a.play().catch(byTimer); // jika browser memblokir suara otomatis, tetap lanjut lewat timer
    } else byTimer();
    return halt;
  }, [i, playing, sound, step.say, step.audio, last]);

  const finish = () => { halt(); set({ tutorialSeen: true }); onClose(); };
  const go = (n: number) => setI(Math.min(STEPS.length - 1, Math.max(0, n)));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Tutorial">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="chunky w-full max-w-lg p-5">
        <div className="mb-2 flex items-center">
          <div className="flex gap-1.5">{STEPS.map((_, k) => <i key={k} className={`h-2.5 w-6 rounded-full border-2 border-[var(--line)] ${k <= i ? 'bg-[var(--accent)]' : 'bg-[var(--road)]'}`} />)}</div>
          <button onClick={finish} className="ml-auto rounded-lg p-1" aria-label="Tutup tutorial"><X /></button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.18 }} className="min-h-[16rem] text-center">
            <div className="text-6xl">{step.icon}</div>
            <h2 className="mt-1 text-2xl font-bold">{step.title}</h2>
            {step.code && <pre className="mx-auto mt-3 w-fit rounded-xl bg-[var(--term)] px-4 py-2 text-left font-mono text-sm leading-6 text-[var(--term-ink)]">{step.code}</pre>}
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed">{step.say}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => setSound((v) => !v)} className="btn3d rounded-xl bg-sky-300 p-2 text-slate-900" aria-label={sound ? 'Matikan suara' : 'Nyalakan suara'}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
          <button onClick={() => go(i - 1)} disabled={i === 0} className="btn3d flex items-center rounded-xl bg-[var(--road)] px-3 py-2 text-[var(--ink)] disabled:opacity-40" aria-label="Kembali"><ChevronLeft size={18} /></button>
          <button onClick={() => setPlaying((p) => !p)} className="btn3d ml-auto flex items-center gap-1 rounded-xl bg-rose-400 px-4 py-2 text-slate-900">
            {playing ? <><Pause size={18} />Stop</> : <><Play size={18} />Putar</>}
          </button>
          {last
            ? <button onClick={finish} className="btn3d rounded-xl bg-emerald-400 px-4 py-2 text-lg text-slate-900">Mulai Main! 🚀</button>
            : <button onClick={() => go(i + 1)} className="btn3d flex items-center rounded-xl bg-[var(--accent)] px-4 py-2 text-white">Next<ChevronRight size={18} /></button>}
        </div>
      </motion.div>
    </div>
  );
}
