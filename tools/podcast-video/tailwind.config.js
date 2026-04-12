/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#000000',
          white: '#FFFFFF',
          green: '#00C17A',
          greenlight: '#B5E8BE',
          blue: '#0072F9',
          red: '#F24935',
          amber: '#FFBC0A',
          peach: '#FF9172',
          mint: '#B2E2BA',
          sky: '#84DBE5',
          burgundy: '#82003A',
          hotpink: '#FF00B7',
          lavender: '#D1C4E2',
          rose: '#FFC9D8',
          salmon: '#FFBAA3',
          blush: '#FFD1C4',
          paleyellow: '#F9E59E',
          brightyellow: '#FFDD56',
          pinklight: '#FFA5C6',
          skylight: '#AFE2EA',
          aquapale: '#D1EDEF',
          darkslate: '#111421',
          charcoal: '#2B2D3F',
          muted: '#494C6B',
          warmgray: '#EFEDE2',
          cream: '#F4F2ED',
          offwhite: '#F7F4EE',
          warmwhite: '#F2EDEA',
        },
      },
      fontFamily: {
        display: ['Thmanyah Serif Display', 'Georgia', 'serif'],
        body: ['Thmanyah Serif Text', 'Georgia', 'serif'],
        ui: ['Thmanyah Sans', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        'brand': '12px',
        'brand-lg': '16px',
        'brand-xl': '24px',
      },
      boxShadow: {
        'brand-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'brand-md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'brand-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
