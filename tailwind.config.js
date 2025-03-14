/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'geist-mono': ['Geist Mono', 'monospace'],
        'doto': ['Doto', 'sans-serif'],
      },
      colors: {
        'navy': {
          800: '#0a192f',
          900: '#020c1b',
        },
        'dark-slate': {
          700: '#2d3748',
          800: '#1a202c',
          900: '#121721',
        },
      },
    },
  },
  plugins: [],
}