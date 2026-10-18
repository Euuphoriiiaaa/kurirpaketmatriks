export interface Preset { status?: 'semua' | 'belum' | 'main' | 'tamat'; role?: 'semua' | 'pemain' | 'admin'; sort?: 'baru' | 'nama' | 'skor' | 'level' | 'aktif' }
export type Goto = (tab: string, q?: string, preset?: Preset) => void;
