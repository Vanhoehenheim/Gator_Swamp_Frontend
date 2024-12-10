/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'geist-mono': ['Geist Mono', 'monospace'],
        'doto': ['Doto', 'sans-serif'],  // Changed to sans-serif since that's what you used in CSS
      }
    },
  },
  plugins: [],
}