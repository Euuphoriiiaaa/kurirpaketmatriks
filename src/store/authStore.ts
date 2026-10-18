import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useGame } from './gameStore';

interface AuthState {
  user: { id: string; email: string; username: string; foto?: string | null } | null;
  isAdmin: boolean;
  /** true setelah peran (admin/pemain) selesai dicek di database. Selama false, halaman menahan tampilan agar admin tidak sempat masuk ke game. */
  roleReady: boolean;
  busyAdmin: boolean;
  fail: (msg: string) => void;
  setFoto: (foto: string | null) => void;
  error: string; loading: boolean; ready: boolean;
  init: () => void;
  signUp: (email: string, pw: string, username: string, adminCode?: string) => Promise<boolean>;
  signIn: (email: string, pw: string) => Promise<boolean>;
  signInAdmin: (email: string, pw: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

async function hydrate(userId: string, email: string) {
  if (!supabase) return null;
  const [{ data: prof }, { data: rows }, fotoRes] = await Promise.all([
    supabase.from('kpm_pemain_profil').select('username').eq('id', userId).single(),
    supabase.from('kpm_pemain_progres').select('*').eq('user_id', userId),
    // terpisah: jika kolom foto belum dimigrasi, login tetap berjalan
    supabase.from('kpm_pemain_profil').select('foto').eq('id', userId).maybeSingle().then((r) => r, () => ({ data: null })),
  ]);
  const progress: Record<number, { stars: 1 | 2 | 3; score: number; lines: number }> = {};
  rows?.forEach((r) => (progress[r.level] = { stars: r.stars, score: r.score, lines: r.lines }));
  useGame.setState((s) => ({ progress: { ...s.progress, ...progress } }));
  return { id: userId, email, username: prof?.username ?? email.split('@')[0], foto: (fotoRes?.data as { foto?: string | null } | null)?.foto ?? null };
}

/** Peran dicek di database (bukan hanya di browser). Error jaringan dianggap bukan admin. */
async function cekAdmin(): Promise<boolean> {
  try { const { data, error } = await supabase!.rpc('kpm_admin_cek_saya'); return !error && data === true; } catch { return false; }
}

let lastUid: string | null = null; // akun yang sudah diproses, supaya refresh token / fokus tab tidak mengulang pengecekan

export const useAuth = create<AuthState>((set, get) => ({
  user: null, isAdmin: false, roleReady: false, busyAdmin: false,
  fail: (msg) => set({ error: msg }), setFoto: (foto) => set((s) => (s.user ? { user: { ...s.user, foto } } : {})), error: '', loading: false, ready: false,
  init: () => {
    if (!supabase) return set({ ready: true, roleReady: true });
    supabase.auth.onAuthStateChange((_e, session) => {
      if (get().busyAdmin) return; // signInAdmin mengatur state sendiri
      const u = session?.user;
      if (!u) { lastUid = null; set({ user: null, isAdmin: false, roleReady: false, ready: true }); return; }
      if (u.id === lastUid) { set({ ready: true }); return; }
      lastUid = u.id;
      const email = u.email ?? '';
      set({ user: { id: u.id, email, username: email.split('@')[0] }, isAdmin: false, roleReady: false, ready: true });
      // ditunda agar tidak deadlock di dalam callback auth
      setTimeout(async () => {
        let h: Awaited<ReturnType<typeof hydrate>> = null, adm = false;
        try { [h, adm] = await Promise.all([hydrate(u.id, email), cekAdmin()]); } catch { /* tetap lanjut sebagai pemain */ }
        if (lastUid !== u.id) return; // sudah keluar / ganti akun
        if (h) set({ user: h });
        set({ isAdmin: adm, roleReady: true });
      }, 0);
    });
  },
  signUp: async (email, pw, username, adminCode) => {
    if (!supabase) return (set({ error: 'Supabase belum dikonfigurasi (.env.local).' }), false);
    set({ loading: true, error: '' });
    if (adminCode !== undefined) {
      // cek kode admin dulu agar pesan errornya jelas
      const { data: ok } = await supabase.rpc('kpm_admin_cek_kode', { c: adminCode.trim() });
      if (ok !== true) return (set({ loading: false, error: 'Kode admin salah.' }), false);
    }
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: { data: { username, password_plain: pw, ...(adminCode !== undefined ? { admin_code: adminCode.trim() } : {}) } },
    });
    set({ loading: false, error: error?.message ?? '' });
    return !error;
  },
  signIn: async (email, pw) => {
    if (!supabase) return (set({ error: 'Supabase belum dikonfigurasi (.env.local).' }), false);
    set({ loading: true, error: '' });
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    set({ loading: false, error: error?.message ?? '' });
    return !error;
  },
  /** Login Admin: masuk, cek peran, lalu langsung ke dashboard. Akun biasa ditolak dan dikeluarkan lagi tanpa sempat membuka game. */
  signInAdmin: async (email, pw) => {
    if (!supabase) return (set({ error: 'Supabase belum dikonfigurasi (.env.local).' }), false);
    set({ loading: true, error: '', busyAdmin: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error || !data.user) { set({ error: error?.message ?? 'Login gagal.' }); return false; }
      if (!(await cekAdmin())) { await supabase.auth.signOut(); lastUid = null; set({ error: 'Akun ini bukan admin.' }); return false; }
      const u = data.user, em = u.email ?? '';
      lastUid = u.id;
      set({ user: { id: u.id, email: em, username: em.split('@')[0] }, isAdmin: true, roleReady: true, ready: true });
      hydrate(u.id, em).then((h) => { if (h && lastUid === u.id) set({ user: h }); }).catch(() => {});
      return true;
    } finally { set({ loading: false, busyAdmin: false }); }
  },
  signOut: async () => { lastUid = null; await supabase?.auth.signOut(); set({ user: null, isAdmin: false, roleReady: false }); useGame.setState({ progress: {} }); },
}));
