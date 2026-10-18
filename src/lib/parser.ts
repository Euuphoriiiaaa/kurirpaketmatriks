import { Cmd, Op, ParseResult } from './types';

interface Tok { t: string; line: number }
const SIMPLE: Record<string, Op> = {
  MAJU: 'MAJU', MUNDUR: 'MUNDUR', RIGHT: 'KANAN', LEFT: 'KIRI', UTURN: 'BALIK',
  AMBIL: 'AMBIL', PICKUP: 'AMBIL', SERAH: 'SERAH', DELIVER: 'SERAH',
};
const MAX_REPEAT = 20;

function tokenize(code: string): { toks: Tok[]; lineCount: number } {
  const toks: Tok[] = [];
  let lineCount = 0;
  code.split('\n').forEach((raw, i) => {
    const text = raw.split('#')[0].trim().toUpperCase(); // '#' = komentar
    if (!text) return;
    lineCount++;
    (text.match(/[{}\[\]]|[^\s{}\[\]]+/g) ?? []).forEach((t) => toks.push({ t, line: i + 1 }));
  });
  return { toks, lineCount };
}

export function parse(code: string): ParseResult {
  const { toks, lineCount } = tokenize(code);
  const errors: string[] = [];
  let usesLoop = false;
  let p = 0;

  function block(close: string | null): Cmd[] {
    const out: Cmd[] = [];
    while (p < toks.length) {
      const { t, line } = toks[p];
      if (t === '}' || t === ']') {
        if (close === t) return out;
        errors.push(`Baris ${line}: tanda "${t}" tidak sesuai.`); p++; continue;
      }
      p++;
      if (t === 'BELOK') {
        const d = toks[p]?.t;
        if (d === 'KANAN' || d === 'KIRI') { p++; out.push({ op: d, line }); }
        else errors.push(`Baris ${line}: BELOK harus diikuti KANAN atau KIRI.`);
      } else if (t === 'BALIK') {
        if (toks[p]?.t === 'ARAH') p++;
        out.push({ op: 'BALIK', line });
      } else if (t === 'ULANGI' || t === 'REPEAT') {
        const n = Number(toks[p]?.t); p++;
        const open = toks[p]?.t;
        if (!Number.isInteger(n) || n < 1 || n > MAX_REPEAT) {
          errors.push(`Baris ${line}: jumlah ulang harus 1-${MAX_REPEAT}.`); continue;
        }
        if (open !== '{' && open !== '[') { errors.push(`Baris ${line}: butuh "{" setelah jumlah ulang.`); continue; }
        p++;
        const want = open === '{' ? '}' : ']';
        const body = block(want);
        if (toks[p]?.t !== want) { errors.push(`Baris ${line}: blok ULANGI belum ditutup "${want}".`); continue; }
        p++;
        usesLoop = true;
        for (let i = 0; i < n; i++) out.push(...body);
      } else if (SIMPLE[t]) {
        out.push({ op: SIMPLE[t], line });
      } else {
        errors.push(`Baris ${line}: perintah "${t}" tidak dikenal.`);
      }
    }
    return out;
  }

  const cmds = block(null);
  return { cmds, lineCount, usesLoop, errors };
}
