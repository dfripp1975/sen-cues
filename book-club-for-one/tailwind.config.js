/** @type {import('tailwindcss').Config} */
// Design tokens for The Book Club For One.
// Token names are shared by every page, so retune values here rather than
// introducing new one-off colours in components.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Page and surface
        paper: { DEFAULT: '#F4EFE4', dark: '#121613' },
        ivory: { DEFAULT: '#FFFCF5', dark: '#1A201C' },
        // Ink green, the brand colour
        forest: {
          DEFAULT: '#1F3D31',
          50: '#EBF1EC',
          100: '#D4E2D8',
          200: '#A9C4B1',
          300: '#7EA28A',
          400: '#3F6653',
          500: '#1F3D31',
          600: '#183127',
          700: '#12251D',
          800: '#0D1B15',
          900: '#07100C',
        },
        sage: {
          DEFAULT: '#7A9A84',
          50: '#EFF3EE',
          100: '#DFE8E0',
          200: '#C4D4C8',
          300: '#A3BBA9',
          400: '#7A9A84',
          500: '#5D7C67',
          600: '#486152',
          700: '#36493D',
          800: '#26332B',
          900: '#18201B',
        },
        // Accent: used sparingly, for the one main action on a screen
        terracotta: {
          DEFAULT: '#B4502C',
          50: '#FAEDE7',
          100: '#F3D6CA',
          200: '#E6AE97',
          300: '#D4835F',
          400: '#B4502C',
          500: '#9A4222',
          600: '#7C341A',
          700: '#5E2713',
          800: '#401A0D',
          900: '#250F07',
        },
        charcoal: { DEFAULT: '#1D1E1A', light: '#3A3B35' },
        warmgrey: { DEFAULT: '#63645C', light: '#85867E' },
        stone: { DEFAULT: '#E2D9C8', light: '#ECE5D7', dark: '#CFC4AF' },
        dark: {
          bg: '#121613',
          card: '#1A201C',
          text: '#EFEADF',
          sub: '#A7ADA6',
          sage: '#A2C4AB',
          terra: '#E8906A',
          border: '#2A322D',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Iowan Old Style', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display sizes for headlines, fluid between phone and desktop
        'display-xl': ['clamp(2.75rem, 1.6rem + 4.6vw, 5.5rem)', { lineHeight: '0.98', letterSpacing: '-0.025em' }],
        'display-lg': ['clamp(2.25rem, 1.6rem + 2.6vw, 3.75rem)', { lineHeight: '1.04', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(29, 30, 26, 0.05)',
        card: '0 1px 2px rgba(29, 30, 26, 0.04), 0 6px 18px -8px rgba(31, 61, 49, 0.14)',
        lift: '0 2px 4px rgba(29, 30, 26, 0.05), 0 16px 32px -12px rgba(31, 61, 49, 0.22)',
        book: '0 1px 1px rgba(0,0,0,0.12), 0 8px 18px -6px rgba(0,0,0,0.35)',
      },
      maxWidth: {
        page: '78rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.2, 0.7, 0.2, 1)',
        reveal: 'slideUp 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
