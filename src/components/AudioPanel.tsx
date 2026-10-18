'use client';
import { Music, Volume2 } from 'lucide-react';
import { useSettings, Bgm } from '@/store/settingsStore';
import { setBgm, playSfx } from '@/lib/audio';

const OPTS: [Bgm, string][] = [['off', 'Mati'], ['lofi', 'Chill Lo-Fi'], ['arcade', 'Upbeat Arcade'], ['city', 'Energetic City']];

export function AudioPanel() {
  const { bgm, bgmVol, sfxVol, set } = useSettings();
  return (
    <div className="space-y-2 text-sm">
      <label className="flex items-center gap-2 font-bold"><Music size={16} />BGM
        <select value={bgm} className="ml-auto rounded-lg bg-[var(--road)] px-2 py-1"
          onChange={(e) => { const v = e.target.value as Bgm; set({ bgm: v }); setBgm(v); }}>
          {OPTS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">Volume BGM
        <input type="range" min={0} max={1} step={0.05} value={bgmVol} className="ml-auto w-32 accent-[var(--accent)]"
          onChange={(e) => set({ bgmVol: +e.target.value })} />
      </label>
      <label className="flex items-center gap-2"><Volume2 size={16} />Volume SFX
        <input type="range" min={0} max={1} step={0.05} value={sfxVol} className="ml-auto w-32 accent-[var(--accent)]"
          onChange={(e) => set({ sfxVol: +e.target.value })} onPointerUp={() => playSfx('pickup')} />
      </label>
    </div>
  );
}
