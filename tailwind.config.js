/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brutal': {
          white: '#FFFFFF',
          black: '#000000',
          profit: '#166534',
          loss: '#991B1B',
        }
      },
      fontFamily: {
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      borderWidth: {
        '6': '6px',
      }
    },
  },
  plugins: [],
}
