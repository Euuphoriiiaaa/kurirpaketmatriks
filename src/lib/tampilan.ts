import { create } from 'zustand';
import { supabase } from './supabase';

export type BgKey = 'bg_login' | 'bg_register' | 'bg_admin';
interface T { bg: Partial<Record<BgKey, string | null>>; muat: (k: BgKey) => Promise<void>; set: (k: BgKey, v: string | null) => void }

/** Background halaman login. Diambil per halaman (hanya yang dibutuhkan) lewat fungsi publik, lalu di-cache. */
export const useTampilan = create<T>((set, get) => ({
  bg: {},
  muat: async (k) => {
    if (get().bg[k] !== undefined || !supabase) return;
    try { const { data } = await supabase.rpc('kpm_publik_ambil', { k }); set((s) => ({ bg: { ...s.bg, [k]: typeof data === 'string' && data ? data : null } })); }
    catch { set((s) => ({ bg: { ...s.bg, [k]: null } })); }
  },
  set: (k, v) => set((s) => ({ bg: { ...s.bg, [k]: v } })),
}));
