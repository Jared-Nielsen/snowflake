import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'rgb(var(--bg-base) / <alpha-value>)',
          panel: 'rgb(var(--bg-panel) / <alpha-value>)',
          elev: 'rgb(var(--bg-elev) / <alpha-value>)',
        },
        edge: {
          subtle: 'rgb(var(--edge-subtle) / <alpha-value>)',
          strong: 'rgb(var(--edge-strong) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          dim: 'rgb(var(--ink-dim) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
        },
        snow: 'rgb(var(--snow) / <alpha-value>)',
        cyan: 'rgb(var(--cyan) / <alpha-value>)',
        amber: 'rgb(var(--amber) / <alpha-value>)',
        signal: 'rgb(var(--signal) / <alpha-value>)',
        alarm: 'rgb(var(--alarm) / <alpha-value>)',
        copper: 'rgb(var(--copper) / <alpha-value>)',
        flare: 'rgb(var(--flare) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        cond: ['"IBM Plex Sans Condensed"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 4s linear infinite',
        'tick': 'tick 1.5s steps(1) infinite',
        'flicker': 'flicker 6s infinite',
        'flow-dash': 'flow-dash 1s linear infinite',
        'reveal-up': 'reveal-up 600ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'sweep': 'sweep 12s linear infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'tick': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0.25' },
        },
        'flicker': {
          '0%, 100%': { opacity: '0.4' },
          '1%, 5%, 9%': { opacity: '0.15' },
          '6%': { opacity: '0.5' },
        },
        'flow-dash': {
          to: { strokeDashoffset: '-12' },
        },
        'reveal-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
