/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neo-bg': 'var(--theme-bg)',
        'neo-surface': 'var(--theme-surface)',
        'neo-primary': 'var(--theme-primary)',
        'neo-secondary': 'var(--theme-secondary)',
        'neo-accent': 'var(--theme-accent)',
        'neo-text': 'var(--theme-text)',
        'neo-text-dim': 'var(--theme-text-dim)',
        'neo-border': 'var(--theme-border)',
        'neo-pink': '#ff4d8d',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'space-gradient': 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0f 100%)',
      }
    },
  },
  plugins: [],
}
