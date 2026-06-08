/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Paleta Letramente ──────────────────────────────
        'letra-orange':       '#ff7b2c',
        'letra-yellow':       '#ffd23f',
        'letra-green':        '#2eb87e',
        'letra-purple':       '#8b5cf6',
        'letra-navy':         '#1a2b5e',
        'letra-cyan':         '#06b6d4',
        'letra-pink':         '#ec4899',
        'letra-orange-light': '#ffaa6b',
        'letra-orange-dark':  '#cc5a14',
        'letra-green-light':  '#5ed4a4',
        'letra-green-dark':   '#1a8a5a',
        'letra-purple-light': '#c4b5fd',
        'letra-navy-light':   '#2d4a9e',
        'letra-navy-dark':    '#0f1a3d',
        'letra-cyan-light':   '#67e8f9',
        'bg-body':            '#080e24',
        'bg-surface':         '#101a3d',
        'bg-card':            '#121e45',
      },
      fontFamily: {
        brand: ['Nunito', 'sans-serif'],
        body:  ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-orange': '0 0 30px rgba(255,123,44,0.5)',
        'glow-green':  '0 0 30px rgba(46,184,126,0.4)',
        'glow-purple': '0 0 30px rgba(139,92,246,0.5)',
        'glow-cyan':   '0 0 30px rgba(6,182,212,0.4)',
        'glow-yellow': '0 0 30px rgba(255,210,63,0.4)',
        'card':        '0 8px 32px rgba(0,0,0,0.5)',
        'card-hover':  '0 20px 60px rgba(0,0,0,0.6)',
      },
      animation: {
        'float':      'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'dot-pulse':  'dotPulse 2s ease-in-out infinite',
        'gradient':   'gradientShift 4s ease infinite',
        'bounce-in':  'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer':    'shimmer 1.5s infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        float:         { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        pulseGlow:     { '0%,100%': { boxShadow: '0 0 20px rgba(6,182,212,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(6,182,212,0.7)' } },
        dotPulse:      { '0%,100%': { transform: 'scale(1)', opacity: '0.6' }, '50%': { transform: 'scale(1.4)', opacity: '1' } },
        gradientShift: { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
        bounceIn:      { '0%': { transform: 'scale(0.5)', opacity: '0' }, '70%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shimmer:       { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
      },
    },
  },
  plugins: [],
};
