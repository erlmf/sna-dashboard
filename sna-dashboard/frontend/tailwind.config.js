/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        body:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        ink:    '#0a0a0f',
        panel:  '#111118',
        border: '#1e1e2e',
        muted:  '#2a2a3d',
        dim:    '#6b7280',
        text:   '#e8e8f0',
        accent: '#7c6af7',
        cyan:   '#22d3ee',
        green:  '#4ade80',
        amber:  '#fbbf24',
        red:    '#f87171',
      },
    },
  },
  plugins: [],
}
