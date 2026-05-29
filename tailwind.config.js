module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B63F6',
          50: '#E9F2FF',
        },
        bg: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Livvic', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
