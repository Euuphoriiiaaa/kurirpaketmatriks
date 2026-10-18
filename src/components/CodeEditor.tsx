'use client';
import { useRef } from 'react';
import { LEVELS } from '@/lib/levels';
import { useGame } from '@/store/gameStore';

const CHEAT = ['MAJU', 'MUNDUR', 'BELOK KANAN', 'BELOK KIRI', 'BALIK ARAH', 'AMBIL', 'SERAH', 'ULANGI 3 { MAJU }'];

export function CodeEditor() {
  const { code, setCode, status, steps, idx, levelId } = useGame();
  const lv = LEVELS[levelId - 1];
  const gutter = useRef<HTMLDivElement>(null);
  const lines = code.split('\n');
  const used = lines.filter((l) => l.split('#')[0].trim()).length;
  const active = status === 'playing' || status === 'paused' ? steps[idx]?.line : 0;
  const add = (c: string) => setCode(code + (code && !code.endsWith('\n') ? '\n' : '') + c + '\n');

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      <p className="mb-1 text-xs font-bold">Ketuk perintah untuk menambahkannya:</p>
      <div className="mb-1.5 flex shrink-0 flex-wrap gap-1">
        {CHEAT.map((c) => (
          <button key={c} onClick={() => add(c)} disabled={status === 'playing'}
            className="btn3d rounded-lg bg-[var(--road)] px-2 py-1 font-mono text-xs font-bold text-[var(--ink)]" style={{ boxShadow: '0 2px 0 var(--line)' }}>{c}</button>
        ))}
      </div>
      <div className="flex h-44 overflow-hidden lg:h-auto lg:min-h-[5rem] lg:flex-1 rounded-2xl border-[3px] border-[var(--line)] bg-[var(--term)] font-mono text-base text-[var(--term-ink)]">
        <div ref={gutter} className="select-none overflow-hidden bg-black/30 px-2.5 py-2 text-right leading-7 text-slate-500">
          {lines.map((_, i) => <div key={i} className={active === i + 1 ? 'font-bold text-amber-300' : ''}>{i + 1}</div>)}
        </div>
        <textarea value={code} disabled={status === 'playing'} spellCheck={false} aria-label="Editor kode"
          onChange={(e) => setCode(e.target.value)}
          onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop; }}
          placeholder={'MAJU\nBELOK KANAN\nULANGI 2 { MAJU }'}
          className="flex-1 resize-none bg-transparent p-2 leading-7 outline-none placeholder:text-slate-600" />
      </div>
      <p className={`mt-1 shrink-0 text-right text-xs font-bold ${used > lv.maxLines ? 'text-red-600' : 'text-[var(--muted)]'}`}>
        {used}/{lv.maxLines} baris · ⭐⭐⭐ jika ≤ {lv.stars.three} baris{lv.stars.needLoopForThree ? ' dan pakai ULANGI' : ''}
      </p>
    </div>
  );
}
