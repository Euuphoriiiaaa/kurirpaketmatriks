/* Avatar: foto unggahan / URL, karakter kartun kurir berseragam admin (SVG, "karakter:<id>"), atau inisial. */

export interface Karakter {
  id: string; nama: string; skin: string; hair: string; bg: string;
  gaya: 'topi' | 'kuncir' | 'hijab' | 'sanggul' | 'keriting';
  seragam: string; topi: string; kacamata?: boolean; jenggot?: boolean;
}

export const KARAKTER: Karakter[] = [
  { id: 'budi', nama: 'Budi', skin: '#f1c27d', hair: '#2b1d14', bg: '#ffe2b8', gaya: 'topi', seragam: '#ff8a1f', topi: '#e36f00' },
  { id: 'sari', nama: 'Sari', skin: '#e0ac69', hair: '#4a2c17', bg: '#cfeeff', gaya: 'kuncir', seragam: '#1d8fe0', topi: '#1673b8' },
  { id: 'putri', nama: 'Putri', skin: '#f6cf9c', hair: '#ff8a1f', bg: '#ffe9d2', gaya: 'hijab', seragam: '#ff8a1f', topi: '#ff8a1f' },
  { id: 'andi', nama: 'Andi', skin: '#8d5524', hair: '#141414', bg: '#d4f5dd', gaya: 'topi', seragam: '#16a34a', topi: '#0f7a37', kacamata: true },
  { id: 'dewi', nama: 'Dewi', skin: '#ffdbac', hair: '#2a1a3a', bg: '#ecdcff', gaya: 'sanggul', seragam: '#8b5cf6', topi: '#7041d6' },
  { id: 'rangga', nama: 'Rangga', skin: '#c68642', hair: '#1c1410', bg: '#ffd9d9', gaya: 'topi', seragam: '#dc2626', topi: '#b61b1b', jenggot: true },
  { id: 'nadia', nama: 'Nadia', skin: '#e8b88a', hair: '#1d8fe0', bg: '#d8ecff', gaya: 'hijab', seragam: '#1d8fe0', topi: '#1d8fe0', kacamata: true },
  { id: 'rudi', nama: 'Rudi', skin: '#a8693a', hair: '#1a120d', bg: '#d2f3f0', gaya: 'keriting', seragam: '#0d9488', topi: '#0b7a70' },
];

export function Kurir({ c, size = 64 }: { c: Karakter; size?: number }) {
  const hijab = c.gaya === 'hijab', topi = c.gaya === 'topi' || c.gaya === 'kuncir';
  const eyeL = hijab ? 44.5 : 43.5, eyeR = hijab ? 55.5 : 56.5;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Karakter kurir ${c.nama}`} style={{ display: 'block' }}>
      <circle cx="50" cy="50" r="50" fill={c.bg} />
      {/* rambut belakang */}
      {c.gaya === 'kuncir' && <path d="M64 30 Q90 34 82 66 Q78 50 68 44Z" fill={c.hair} />}
      {c.gaya === 'sanggul' && <circle cx="50" cy="15" r="8" fill={c.hair} />}
      {hijab && <path d="M50 19 Q22 19 24 52 Q26 70 36 74 L64 74 Q74 70 76 52 Q78 19 50 19Z" fill={c.seragam} />}
      {/* badan: rompi seragam */}
      <path d="M15.3 86 Q20 69 50 67 Q80 69 84.7 86 A50 50 0 0 1 15.3 86 Z" fill={c.seragam} />
      <path d="M22 88 Q50 80 78 88" stroke="#fff" strokeOpacity=".85" strokeWidth="3" fill="none" />
      <path d="M40 68 L50 82 L60 68 Z" fill="#fff" />
      <rect x="57.5" y="78" width="19" height="9" rx="1.8" fill="#fff" />
      <text x="67" y="84.2" fontSize="4.1" fontWeight="800" textAnchor="middle" fill={c.seragam} fontFamily="system-ui, sans-serif">ADMIN</text>
      {hijab && <path d="M30 66 Q50 80 70 66 L75 76 Q50 90 25 76Z" fill={c.seragam} />}
      {/* leher & kepala */}
      <rect x="44" y="57" width="12" height="15" rx="4" fill={c.skin} />
      <ellipse cx="50" cy="44" rx={hijab ? 16 : 19} ry={hijab ? 18 : 21} fill={c.skin} />
      {!hijab && <><circle cx="31" cy="46" r="3.5" fill={c.skin} /><circle cx="69" cy="46" r="3.5" fill={c.skin} /></>}
      {/* rambut depan / topi */}
      {c.gaya === 'sanggul' && <><path d="M31 42 Q30 21 50 21 Q70 21 69 42 Q60 31 50 31 Q40 31 31 42Z" fill={c.hair} /><path d="M31 35 Q50 26 69 35" stroke={c.seragam} strokeWidth="3.2" fill="none" /></>}
      {c.gaya === 'keriting' && [[35, 29, 7], [46, 23, 8], [58, 23, 8], [67, 30, 7], [31, 39, 5], [70, 39, 5]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={c.hair} />)}
      {topi && <>
        <path d="M31 43 Q30 51 33 53 L33 43Z" fill={c.hair} /><path d="M69 43 Q70 51 67 53 L67 43Z" fill={c.hair} />
        <path d="M30 40 Q30 17 50 17 Q70 17 70 40 Q50 34 30 40Z" fill={c.topi} />
        <path d="M27 40 Q50 32 73 40 Q73 46 66 45 Q50 39 34 45 Q27 46 27 40Z" fill={c.seragam} />
        <circle cx="50" cy="27" r="6" fill="#fff" /><rect x="47" y="24.5" width="6" height="5" rx="1" fill={c.topi} /><path d="M47 26.5 H53" stroke="#fff" strokeWidth=".8" />
      </>}
      {/* jenggot */}
      {c.jenggot && <path d="M33 51 Q34 70 50 70 Q66 70 67 51 Q60 61 50 61 Q40 61 33 51Z" fill={c.hair} />}
      {/* wajah */}
      <path d={`M${eyeL - 4} 40.5 Q${eyeL} 38.5 ${eyeL + 4} 40.5`} stroke={c.hair} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d={`M${eyeR - 4} 40.5 Q${eyeR} 38.5 ${eyeR + 4} 40.5`} stroke={c.hair} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx={eyeL} cy="46" r="2.4" fill="#222" /><circle cx={eyeR} cy="46" r="2.4" fill="#222" />
      <circle cx={eyeL + 0.8} cy="45.2" r=".8" fill="#fff" /><circle cx={eyeR + 0.8} cy="45.2" r=".8" fill="#fff" />
      <circle cx="39" cy="52" r="3" fill="#ff7a8a" opacity=".35" /><circle cx="61" cy="52" r="3" fill="#ff7a8a" opacity=".35" />
      <path d="M50 47 Q48.6 51 50.5 51.4" stroke="#00000033" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M44 55 Q50 60.5 56 55" stroke={c.jenggot ? '#fff' : '#7a2f2f'} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {c.kacamata && <g stroke="#222" strokeWidth="1.3" fill="#fff" fillOpacity=".18"><circle cx={eyeL} cy="46" r="5.6" /><circle cx={eyeR} cy="46" r="5.6" /><path d={`M${eyeL + 5.6} 46 H${eyeR - 5.6}`} fill="none" /></g>}
      {/* headset admin */}
      <rect x={hijab ? 31 : 27.5} y="41" width="4.5" height="12" rx="2.2" fill="#2d3748" />
      <rect x={hijab ? 64.5 : 68} y="41" width="4.5" height="12" rx="2.2" fill="#2d3748" />
      <path d={`M${hijab ? 33 : 29.5} 53 Q${hijab ? 35 : 32} 63 43 61`} stroke="#2d3748" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="61" r="2.2" fill="#2d3748" />
    </svg>
  );
}

export function Avatar({ foto, nama, size = 40, className = '' }: { foto?: string | null; nama?: string | null; size?: number; className?: string }) {
  const base = `shrink-0 overflow-hidden rounded-full border-2 border-[var(--line)] ${className}`;
  const k = foto?.startsWith('karakter:') ? KARAKTER.find((x) => x.id === foto.slice(9)) : undefined;
  if (k) return <span className={base} style={{ width: size, height: size, display: 'inline-block' }}><Kurir c={k} size={size} /></span>;
  if (foto && /^(data:image\/|https?:\/\/)/.test(foto))
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt={`Foto ${nama ?? 'pengguna'}`} width={size} height={size} className={`${base} object-cover`} style={{ width: size, height: size }} referrerPolicy="no-referrer" />;
  return <span className={`${base} flex items-center justify-center bg-[var(--accent)] font-extrabold uppercase text-white`} style={{ width: size, height: size, fontSize: size * 0.42 }}>{(nama ?? '?')[0]}</span>;
}
