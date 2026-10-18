import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: { fontFamily: { display: ['var(--font-display)', 'system-ui'], body: ['var(--font-body)', 'system-ui'], mono: ['var(--font-mono)', 'ui-monospace', 'monospace'] } } },
  plugins: [],
} satisfies Config;
