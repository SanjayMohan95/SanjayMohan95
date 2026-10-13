import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff4ed',
          100: '#ffe6d4',
          200: '#ffc9a8',
          300: '#ffa371',
          400: '#ff7238',
          500: '#fe4f11',
          600: '#c2380a',
          700: '#a12506',
          800: '#7f1d06',
          900: '#5e1605',
        },
        ink: {
          50: '#f6f6f7',
          100: '#e2e3e6',
          200: '#c5c7cd',
          300: '#a0a3ac',
          400: '#7b7f8a',
          500: '#5f636e',
          600: '#4a4d57',
          700: '#3a3c44',
          800: '#24252b',
          900: '#141519',
          950: '#0b0b0e',
        },
        herb: {
          50: '#ecfdf3',
          100: '#d1fadf',
          500: '#12a150',
          600: '#0a7d3c',
          700: '#086331',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,21,25,0.06), 0 8px 24px -12px rgba(20,21,25,0.18)',
        lift: '0 18px 40px -18px rgba(20,21,25,0.35)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
