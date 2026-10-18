'use client';
import { useSettings, Theme } from '@/store/settingsStore';

const THEMES: { id: Theme; name: string; sw: string[] }[] = [
  { id: 'classic', name: 'Logistik Klasik', sw: ['#fef3c7', '#f59e0b', '#e2e8f0'] },
  { id: 'cyber', name: 'Cyberpunk Neon', sw: ['#0b0221', '#ff2bd6', '#00f0ff'] },
  { id: 'pastel', name: 'Pastel Soft', sw: ['#fde4ec', '#c4b5fd', '#bae6fd'] },
  { id: 'dark', name: 'Dark Mode', sw: ['#0f172a', '#38bdf8', '#334155'] },
];

export function ThemePicker() {
  const { theme, set } = useSettings();
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEMES.map((t) => (
        <button key={t.id} onClick={() => set({ theme: t.id })}
          className={`rounded-xl border-2 p-2 text-left text-xs font-bold ${theme === t.id ? 'border-[var(--accent)]' : 'border-transparent bg-[var(--road)]'}`}>
          <span className="mb-1 flex gap-1">{t.sw.map((c) => <i key={c} className="h-4 w-4 rounded-full border" style={{ background: c }} />)}</span>
          {t.name}
        </button>
      ))}
    </div>
  );
}
