// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        surface: {
          50:  '#f8f8f8',
          100: '#f0f0f0',
          800: '#1e1e1e',
          850: '#181818',
          900: '#141414',
          950: '#0d0d0d',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover:   '#4f52d8',
          muted:   '#3d3f8a',
        },
      },
      typography: (theme) => ({
        invert: {
          css: {
            '--tw-prose-body': theme('colors.zinc.300'),
            '--tw-prose-headings': theme('colors.zinc.100'),
            '--tw-prose-code': theme('colors.indigo.300'),
          },
        },
      }),
    },
  },
  plugins: [],
};
