export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Dir = 0 | 1 | 2 | 3; // 0=Atas 1=Kanan 2=Bawah 3=Kiri
export type Op = 'MAJU' | 'MUNDUR' | 'KANAN' | 'KIRI' | 'BALIK' | 'AMBIL' | 'SERAH';
export interface Cmd { op: Op; line: number }
export interface Pos { r: number; c: number }
export interface Pkg extends Pos { id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' }
export interface Level {
  id: LevelId;
  title: string;
  goal: string;
  size: number;
  start: Pos;
  finish: Pos;
  packages: Pkg[];          // urutan pengambilan = urutan array
  jams: Pos[];
  timeGoal?: number;        // detik; selesai lebih cepat = bonus
  maxLines: number;         // batas keras jumlah baris
  stars: { three: number; two: number; needLoopForThree: boolean };
}
export interface Snap { r: number; c: number; dir: Dir; picked: string[]; delivered: boolean }
export type LogType = 'info' | 'success' | 'error';
export interface Step { snap: Snap; log?: { type: LogType; text: string }; line: number; done?: 'win' | 'fail' }
export interface ParseResult { cmds: Cmd[]; lineCount: number; usesLoop: boolean; errors: string[] }
