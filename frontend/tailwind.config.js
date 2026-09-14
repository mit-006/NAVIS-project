/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — deep teal-navy, evokes water/terrain rather than generic SaaS blue
        brand: {
          50: '#EAF2F4',
          100: '#CEE1E6',
          300: '#7FAEBB',
          500: '#2F6B7D',
          700: '#1B4A58',
          800: '#123642',
          900: '#0A2530',
          950: '#061A22',
        },
        // Signal accent — warm amber, used for interactive/CTA elements
        signal: {
          400: '#F0B860',
          500: '#E8A33D',
          600: '#C98A29',
        },
        // Severity scale — deliberately richer/less "default alert" than stock Tailwind red/orange/yellow/green
        severity: {
          none: '#D7DCE1',
          low: '#6FA8BA',
          moderate: '#D9A339',
          high: '#C4632B',
          critical: '#A62B26',
          safe: '#2F7A63',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'stat-lg': ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'stat-md': ['1.875rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
        'stat-sm': ['1.25rem', { lineHeight: '1.2', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}
