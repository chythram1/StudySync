/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm, scholarly palette
        parchment: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf3e6',
          300: '#f5e9d4',
          400: '#eddcbc',
          500: '#e2c99e',
          600: '#d4b07a',
          700: '#c19556',
          800: '#a17840',
          900: '#7d5c32',
        },
        ink: {
          50: '#f6f6f7',
          100: '#e2e3e5',
          200: '#c5c6cb',
          300: '#a0a2aa',
          400: '#7c7f89',
          500: '#62656f',
          600: '#4d4f57',
          700: '#3f4147',
          800: '#35373c',
          900: '#1a1b1e',
          950: '#0d0e0f',
        },
        accent: {
          DEFAULT: '#c45d3e',
          light: '#e07a5c',
          dark: '#9a4830',
        },
        sage: {
          DEFAULT: '#5a7c65',
          light: '#7a9c85',
          dark: '#3a5c45',
        }
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['Charter', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'paper': '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        'paper-lg': '0 4px 6px rgba(0,0,0,0.07), 0 10px 40px rgba(0,0,0,0.08)',
        'inner-soft': 'inset 0 2px 4px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
