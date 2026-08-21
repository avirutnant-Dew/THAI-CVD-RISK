/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17342c',
        sage: { 50: '#f4f9f6', 100: '#e5f1e9', 200: '#cce3d5', 500: '#4f8f73', 600: '#3f775f', 700: '#315e4c' },
        cream: '#fbfcf9',
      },
      boxShadow: { card: '0 12px 35px rgba(30, 70, 57, 0.08)' },
      fontFamily: { sans: ['Inter', 'Noto Sans Thai', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
