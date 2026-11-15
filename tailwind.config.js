/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#075C40',
          50: '#F0F8F2',
          100: '#E7F4EB',
          200: '#C2E3CD',
          300: '#8BC9A5',
          400: '#4DA879',
          500: '#16875B',
          600: '#075C40',
          700: '#06432F',
          800: '#092F25',
          900: '#051E18',
        },
        mint: {
          light: '#E7F4EB',
          soft: '#F0F8F2',
          border: '#D0E6D8',
          accent: '#A7D9B8',
        },
        surface: {
          pure: '#FFFFFF',
          warm: '#FAFCFA',
          bg: '#F6F9F6',
          muted: '#F1F5F2',
        },
        brandText: {
          main: '#14221C',
          secondary: '#68756F',
          muted: '#929D97',
        },
        brandBorder: {
          subtle: '#E5ECE7',
          light: '#EEF3F0',
        }
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 2px 8px -2px rgba(6, 67, 47, 0.05), 0 1px 4px -1px rgba(6, 67, 47, 0.03)',
        card: '0 6px 20px -4px rgba(6, 67, 47, 0.08), 0 2px 6px -2px rgba(6, 67, 47, 0.04)',
        floating: '0 12px 32px -6px rgba(6, 67, 47, 0.14)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
