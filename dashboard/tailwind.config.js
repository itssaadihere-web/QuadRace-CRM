/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8faf8',
        card: '#ffffff',
        border: '#e2e8f0',
        forest: {
          50: '#ebf5f0',
          100: '#d1e7db',
          500: '#1e5438',
          800: '#153b27',
          900: '#0f2b1d',
          950: '#081710'
        },
        gold: {
          50: '#fdfbf7',
          100: '#fdf8ec',
          400: '#e5c06a',
          500: '#d4af37',
          600: '#c59b27',
          700: '#b8860b',
        }
      }
    },
  },
  plugins: [],
}
