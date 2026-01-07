/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'violet': {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        'cyan': {
          400: '#22d3ee',
          500: '#06b6d4',
        },
        'lime': {
          400: '#a3e635',
          500: '#84cc16',
        },
        'rose': {
          400: '#fb7185',
          500: '#f43f5e',
        },
        'amber': {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}

