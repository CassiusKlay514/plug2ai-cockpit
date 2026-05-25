/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:   '#F2EBDC',
        ink:     '#0F1B2D',
        ink2:    '#2A3548',
        ocre:    '#C9A55B',
        'ocre-d':'#A8862E',
        rust:    '#7A2E2E',
        grey:    '#7A7468',
        'grey-l':'#A09A8E',
      },
      fontFamily: {
        title: ['"Big Shoulders Display"', 'system-ui', 'sans-serif'],
        sans:  ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Instrument Serif"', 'serif'],
      },
    },
  },
  plugins: [],
}
