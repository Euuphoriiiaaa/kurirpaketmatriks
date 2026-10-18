/** Membaca file gambar, memperkecil/kompres di browser, hasilnya data URL JPEG yang muat di database. */
export async function bacaGambar(file: File, o: { w: number; h: number; mode: 'fit' | 'square'; maxChars: number }): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('File harus berupa gambar (JPG, PNG, atau WebP).');
  if (file.size > 12 * 1024 * 1024) throw new Error('Ukuran file maksimal 12 MB.');
  const src = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak bisa dibaca.')); i.src = src;
  }).finally(() => URL.revokeObjectURL(src));

  let k = 1;
  for (let n = 0; n < 6; n++, k *= 0.82) {
    const c = document.createElement('canvas'), g = c.getContext('2d')!;
    if (o.mode === 'square') {
      const side = Math.min(img.width, img.height), sz = Math.max(48, Math.round(o.w * k));
      c.width = c.height = sz; g.fillStyle = '#fff'; g.fillRect(0, 0, sz, sz);
      g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, sz, sz);
    } else {
      const sc = Math.min(1, o.w / img.width, o.h / img.height) * k;
      c.width = Math.max(1, Math.round(img.width * sc)); c.height = Math.max(1, Math.round(img.height * sc));
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    }
    for (const q of [0.82, 0.68, 0.54]) { const out = c.toDataURL('image/jpeg', q); if (out.length <= o.maxChars) return out; }
  }
  throw new Error('Gambar terlalu besar, coba gambar lain.');
}

export const urlValid = (u: string) => /^https?:\/\/\S+$/i.test(u.trim()) && u.length < 500;
