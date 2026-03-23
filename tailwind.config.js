/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2F5DFF',
        'primary-soft': '#6C8CFF',
        'primary-light': '#EAF1FF',
        'primary-dark': '#1A45D9',
        'text-base': '#1F2A44',
        'text-muted': '#64748b',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'card': '0 4px 24px rgba(47, 93, 255, 0.08)',
        'card-hover': '0 8px 40px rgba(47, 93, 255, 0.14)',
        'blue-glow': '0 0 32px rgba(47, 93, 255, 0.25)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}

