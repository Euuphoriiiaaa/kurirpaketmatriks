/** Efek klik imperatif (Web Animations API): ripple, percikan, konfeti. Tidak memakai state React. */
const reduce = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mk = (css: Partial<CSSStyleDeclaration>) => { const e = document.createElement('div'); Object.assign(e.style, { position: 'fixed', pointerEvents: 'none', zIndex: '200', ...css }); document.body.appendChild(e); return e; };
const go = (e: HTMLElement, kf: Keyframe[], o: KeyframeAnimationOptions) => { const a = e.animate(kf, { fill: 'forwards', ...o }); a.onfinish = () => e.remove(); };
const COLORS = ['#ff8a1f', '#fbbf24', '#34d399', '#38bdf8', '#f472b6', '#a78bfa'];

export function ripple(x: number, y: number) {
  if (reduce()) return;
  const e = mk({ left: `${x - 6}px`, top: `${y - 6}px`, width: '12px', height: '12px', borderRadius: '50%', border: '3px solid var(--accent)', background: 'color-mix(in srgb, var(--accent) 25%, transparent)' });
  go(e, [{ transform: 'scale(1)', opacity: 0.9 }, { transform: 'scale(7)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)' });
}
export function burst(x: number, y: number, n = 8) {
  if (reduce()) return;
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5, d = 26 + Math.random() * 26, s = 5 + Math.random() * 4;
    const e = mk({ left: `${x - s / 2}px`, top: `${y - s / 2}px`, width: `${s}px`, height: `${s}px`, borderRadius: i % 2 ? '50%' : '2px', background: COLORS[i % COLORS.length] });
    go(e, [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(.2) rotate(180deg)`, opacity: 0 }], { duration: 480 + Math.random() * 250, easing: 'cubic-bezier(.1,.8,.3,1)' });
  }
}
export function confetti(n = 36) {
  if (reduce()) return;
  const W = window.innerWidth, H = window.innerHeight;
  for (let i = 0; i < n; i++) {
    const x = W / 2 + (Math.random() - 0.5) * 160, dx = (Math.random() - 0.5) * W * 0.5, up = H * (0.25 + Math.random() * 0.3), s = 6 + Math.random() * 6;
    const e = mk({ left: `${x}px`, top: `${H - 60}px`, width: `${s}px`, height: `${s * 1.6}px`, background: COLORS[i % COLORS.length], borderRadius: '2px' });
    go(e, [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${dx * 0.6}px,${-up}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.45 }, { transform: `translate(${dx}px,${H * 0.25}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.2,.6,.4,1)' });
  }
}
/** Dipasang di onPointerDown root dashboard: ripple untuk semua elemen interaktif, percikan untuk tombol 3D. */
export function clickFx(ev: { target: EventTarget | null; clientX: number; clientY: number }) {
  const t = ev.target as HTMLElement | null;
  const el = t?.closest?.('button, a, select, label, summary, [data-fx]') as HTMLElement | null;
  if (!el || (el as HTMLButtonElement).disabled) return;
  ripple(ev.clientX, ev.clientY);
  if (el.matches('.btn3d, [data-fx="spark"]')) burst(ev.clientX, ev.clientY);
}
