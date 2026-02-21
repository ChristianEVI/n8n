/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F4E79',
          50: '#E8F0FE',
          100: '#C5D9F1',
          200: '#9BC1E3',
          300: '#70A8D5',
          400: '#4690C7',
          500: '#1F4E79',
          600: '#1A4167',
          700: '#153455',
          800: '#102743',
          900: '#0B1A31',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
