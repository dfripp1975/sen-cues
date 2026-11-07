/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF7F0',
          dark: '#171C19',
        },
        ivory: {
          DEFAULT: '#FFFDF8',
          dark: '#202722',
        },
        forest: {
          DEFAULT: '#24483A',
          50: '#E8F0EC',
          100: '#D1E0D6',
          200: '#A3C1AE',
          300: '#789B83',
          400: '#4F7361',
          500: '#24483A',
          600: '#1E3A2F',
          700: '#172B22',
          800: '#0F1E17',
          900: '#08120D',
        },
        sage: {
          DEFAULT: '#789B83',
          50: '#F0F5F1',
          100: '#DDE8E1',
          200: '#C2D4C9',
          300: '#A3BDAC',
          400: '#789B83',
          500: '#5E7E69',
          600: '#4A6453',
          700: '#384D3F',
          800: '#27362C',
          900: '#18221B',
        },
        terracotta: {
          DEFAULT: '#C96745',
          50: '#FBEEE9',
          100: '#F5D9CE',
          200: '#EAB49C',
          300: '#DD9269',
          400: '#C96745',
          500: '#B05538',
          600: '#8E4429',
          700: '#6D351F',
          800: '#4D2615',
          900: '#2E170C',
        },
        charcoal: {
          DEFAULT: '#242421',
          light: '#3D3D38',
        },
        warmgrey: {
          DEFAULT: '#6F706A',
          light: '#8A8B85',
        },
        stone: {
          DEFAULT: '#E7E1D6',
          light: '#F0EBE0',
          dark: '#D4CCBE',
        },
        dark: {
          bg: '#171C19',
          card: '#202722',
          text: '#F5F1E8',
          sub: '#B6BBB5',
          sage: '#8FB49A',
          terra: '#E17A55',
          border: '#2D3530',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(36, 72, 58, 0.06)',
        card: '0 4px 16px rgba(36, 72, 58, 0.08)',
        lift: '0 8px 24px rgba(36, 72, 58, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'reveal': 'reveal 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'scale(0.9) rotateY(10deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
