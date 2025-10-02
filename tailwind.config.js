//tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{css}"
  ],
  darkMode: 'class', // <--- обязательно для переключения темы через класс
  theme: {
    extend: {},
  },
  plugins: [],
}
