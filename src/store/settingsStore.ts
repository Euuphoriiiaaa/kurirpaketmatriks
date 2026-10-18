import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'classic' | 'cyber' | 'pastel' | 'dark';
export type Bgm = 'off' | 'lofi' | 'arcade' | 'city';

interface Settings {
  theme: Theme; bgm: Bgm; bgmVol: number; sfxVol: number; tutorialSeen: boolean;
  set: (p: Partial<Omit<Settings, 'set'>>) => void;
}
export const useSettings = create<Settings>()(
  persist((set) => ({ theme: 'classic', bgm: 'off', bgmVol: 0.4, sfxVol: 0.7, tutorialSeen: false, set: (p) => set(p) }),
    { name: 'kpm-settings' })
);
