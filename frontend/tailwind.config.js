/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'pulse-red': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
          },
          '70%': {
            boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)',
          },
        },
      },
      animation: {
        'pulse-red': 'pulse-red 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
