/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aws: {
          light: '#FF9900',
          DEFAULT: '#FF9900',
          dark: '#E88B00',
          bg: '#FFF8ED',
          border: '#FED7AA'
        },
        golang: {
          light: '#00ADD8',
          DEFAULT: '#00ADD8',
          dark: '#0090B5',
          bg: '#F0F9FF',
          border: '#BAE6FD'
        },
        leetcode: {
          light: '#FFA116',
          DEFAULT: '#FEA015',
          dark: '#E08B0D',
          bg: '#FFFBEB',
          border: '#FDE68A'
        }
      }
    },
  },
  plugins: [],
}
