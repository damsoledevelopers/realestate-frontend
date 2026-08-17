import type { Config } from 'tailwindcss';
import { COLORS } from './src/constants/css';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: COLORS.primary,
        accent: '#F59E0B',
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 24px -4px rgba(22, 101, 52, 0.12), 0 8px 16px -8px rgba(0, 0, 0, 0.08)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;