/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: '#234638',
        sage: '#A9BDA7',
        ivory: '#F8F6F0',
        cream: '#F0EDE4',
        gold: '#C5A568',
        charcoal: '#252D29',
        // Semantic tokens driven by CSS variables so light/dark mode swap cleanly.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        subtle: 'rgb(var(--subtle) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        scripture: ['"Lora"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        soft: '0 1px 2px rgb(37 45 41 / 0.04), 0 8px 24px -8px rgb(37 45 41 / 0.12)',
        lift: '0 2px 4px rgb(37 45 41 / 0.06), 0 16px 40px -12px rgb(37 45 41 / 0.22)',
      },
    },
  },
  plugins: [],
};
