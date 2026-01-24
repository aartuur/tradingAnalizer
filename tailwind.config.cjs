/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#050505',
          dark: '#0a0a0a',
          light: '#121212',
          primary: '#00f2ff',
          secondary: '#7000ff',
          text: '#e0e0e0',
          muted: '#525252'
        }
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 242, 255, 0.3), 0 0 20px rgba(0, 242, 255, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}