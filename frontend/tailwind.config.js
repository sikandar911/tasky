/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d1117',
          secondary: '#161b22',
          tertiary: '#21262d',
          border: '#30363d',
        },
        accent: {
          cyan: '#58a6ff',
          green: '#3fb950',
          yellow: '#d29922',
          red: '#f85149',
          purple: '#bc8cff',
          orange: '#e3b341',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          muted: '#484f58',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
