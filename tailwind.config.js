/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pale-sage': '#DCE5D2',
        'warm-cream': '#F7F6F0',
        'white': '#FFFFFF',
        'forest-green': '#285640',
        'text-primary': '#26332B',
        'text-secondary': '#69766D',
        'light-green': '#EFF4E9',
        'border-color': '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(40, 86, 64, 0.08)',
        'card-hover': '0 4px 12px rgba(40, 86, 64, 0.12)',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
