import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4ec',
          100: '#faE6d1',
          200: '#f2c391',
          300: '#e8a25a',
          400: '#d9832f',
          500: '#b8621f',
          600: '#8f4a17',
          700: '#0f172a',
          800: '#0b1220',
          900: '#070c16'
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)']
      }
    }
  },
  plugins: []
};

export default config;
