/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f7f3',
          100: '#e3eee3',
          200: '#c8dec8',
          300: '#9fc69f',
          400: '#70a670',
          500: '#4d874d',
          600: '#3a6c3a',
          700: '#2f552f',
          800: '#284528',
          900: '#1a3a1a', // Kuchhal Brothers Primary Dark Emerald
          950: '#102110',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(26, 58, 26, 0.08)',
        subtle: '0 2px 10px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
