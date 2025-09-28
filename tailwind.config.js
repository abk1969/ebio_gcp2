/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0D47A1',
        'brand-secondary': '#1565C0',
        'brand-accent': '#1E88E5',
        'brand-light': '#E3F2FD',
        'brand-dark': '#0A3A81',
        'text-primary': '#212121',
        'text-secondary': '#616161',
      },
    },
  },
  plugins: [],
}
