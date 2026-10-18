import './globals.css';
import type { Metadata } from 'next';
import { Fredoka, Nunito, Fira_Code } from 'next/font/google';

const display = Fredoka({ subsets: ['latin'], variable: '--font-display' });
const body = Nunito({ subsets: ['latin'], variable: '--font-body' });
const mono = Fira_Code({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = { title: 'Kurir Paket Matriks', description: 'Game edukasi logika & coding' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</body></html>);
}
