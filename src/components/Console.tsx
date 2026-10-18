'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { fmtTime, useGame } from '@/store/gameStore';

const COLOR: Record<string, string> = { info: 'text-slate-300', success: 'text-emerald-400', error: 'text-red-400' };

export function Console() {
  const { logs, status, result } = useGame();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [logs]);

  return (
    <div className="shrink-0">
      <div ref={box} className="h-24 overflow-y-auto rounded-2xl border-[3px] border-[var(--line)] bg-[var(--term)] p-2 font-mono text-xs">
        {logs.length === 0 && <p className="text-slate-500">{'> Tulis kode lalu tekan "Jalankan"...'}</p>}
        {logs.map((l, i) => <p key={i} className={COLOR[l.type]}>{'> '}{l.text}</p>)}
      </div>
      {status === 'won' && result && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
          className="mt-3 rounded-2xl border-[3px] border-[var(--line)] bg-emerald-200 p-3 text-center text-slate-900">
          <p className="font-display text-xl font-bold">Hebat! Level selesai 🎉</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3].map((n) => <Star key={n} className={n <= result.stars ? 'fill-yellow-400 text-yellow-500' : 'text-slate-400'} size={30} />)}
          </div>
          <p className="font-bold">Skor {result.score} · {result.lines} baris{result.time ? ` · ⏱ ${fmtTime(result.time)}` : ''}</p>
          {result.fast && <p className="mt-1 inline-block rounded-full border-2 border-[var(--line)] bg-yellow-300 px-3 py-0.5 text-sm font-bold">⚡ Bonus cepat +50</p>}
        </motion.div>
      )}
      {status === 'failed' && (
        <p className="mt-3 rounded-2xl border-[3px] border-[var(--line)] bg-red-200 p-2 text-center font-bold text-red-900">
          Belum berhasil. Baca pesan di atas, perbaiki kodenya, lalu coba lagi! 💪
        </p>
      )}
    </div>
  );
}
