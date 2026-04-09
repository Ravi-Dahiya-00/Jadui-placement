/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,jsx,ts,tsx,mdx}',
    './src/components/**/*.{js,jsx,ts,tsx,mdx}',
    './src/features/**/*.{js,jsx,ts,tsx,mdx}',
    './src/app/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background:  '#0a0a14',
        surface:     '#111120',
        card:        '#16162a',
        'card-hover':'#1e1e35',
        border:      'rgba(99,102,241,0.18)',
        primary: {
          DEFAULT:    '#6366f1',
          hover:      '#4f46e5',
          foreground: '#ffffff',
          glow:       'rgba(99,102,241,0.35)',
        },
        secondary: {
          DEFAULT:    '#8b5cf6',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT:    '#06b6d4',
          foreground: '#ffffff',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error:   '#ef4444',
        muted: {
          DEFAULT:    '#94a3b8',
          foreground: '#475569',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.22) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.15) 0%, transparent 60%)',
        'card-gradient':
          'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)',
        'sidebar-gradient':
          'linear-gradient(180deg, #111120 0%, #0d0d1e 100%)',
      },
      boxShadow: {
        glow:       '0 0 24px rgba(99,102,241,0.35)',
        'glow-sm':  '0 0 12px rgba(99,102,241,0.25)',
        'glow-lg':  '0 0 48px rgba(99,102,241,0.4)',
        card:       '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)',
        'card-hover':'0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.25)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-glow':  'pulse-glow 3s ease-in-out infinite',
        'slide-up':    'slide-up 0.5s ease-out',
        'fade-in':     'fade-in 0.4s ease-out',
        'orb-move':    'orb-move 12s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-16px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 16px rgba(99,102,241,0.3)' },
          '50%':      { boxShadow: '0 0 36px rgba(99,102,241,0.6)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'orb-move': {
          '0%':   { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(60px, 40px) scale(1.15)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
