import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Elegant, wedding-appropriate palette: soft blush, warm gold, deep ink.
        blush: {
          50: '#fdf6f4',
          100: '#fae9e6',
          200: '#f4d0ca',
          300: '#ebaea4',
          400: '#dd8071',
          500: '#cf5d4b',
        },
        gold: {
          50: '#fbf8f1',
          100: '#f4ecd8',
          200: '#e8d5ab',
          300: '#d9b874',
          400: '#c99d4a',
          500: '#b0843a',
        },
        ink: {
          700: '#3a3436',
          800: '#2a2527',
          900: '#1b1819',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
    },
  },
  plugins: [],
};

export default config;
