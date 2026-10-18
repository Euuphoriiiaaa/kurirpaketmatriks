// Narasi tutorial memakai Web Speech API (bawaan browser, tanpa file audio).
// Mengutamakan suara Indonesia berjenis laki-laki; jika tidak ada, nada suara diturunkan.
const MALE = /(andika|ardi|rizki|gerald|\bmale\b|pria|laki)/i;

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function prepareVoices() {
  if (!speechSupported()) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

function pickVoice() {
  const id = window.speechSynthesis.getVoices().filter((v) => /^id([-_]|$)/i.test(v.lang));
  return id.find((v) => MALE.test(v.name)) ?? id[0] ?? null;
}

let token = 0; // penanda agar callback suara lama diabaikan

// onEnd dipanggil saat suara selesai dibacakan (atau gagal), kecuali dibatalkan oleh speak/stopSpeak berikutnya.
export function speak(text: string, onEnd?: () => void) {
  if (!speechSupported()) return;
  const s = window.speechSynthesis;
  const my = ++token;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  u.lang = 'id-ID';
  if (v) u.voice = v;
  u.pitch = v && MALE.test(v.name) ? 0.85 : 0.4; // nada rendah agar terdengar seperti suara laki-laki
  u.rate = 0.9;
  const done = () => { if (my === token) onEnd?.(); };
  u.onend = done;
  u.onerror = done;
  s.speak(u);
}

export function stopSpeak() { token++; if (speechSupported()) window.speechSynthesis.cancel(); }
