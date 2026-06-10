/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:       '#070B14',
          surface:  '#0C1221',
          card:     '#101827',
          border:   '#1A2844',
          'border-soft': '#223060',
          cyan:     '#00C2FF',
          blue:     '#3B82F6',
          indigo:   '#6366F1',
          purple:   '#A855F7',
          pink:     '#EC4899',
          green:    '#10B981',
          amber:    '#F59E0B',
          orange:   '#F97316',
          red:      '#EF4444',
          text:     '#E2E8F0',
          'text-dim': '#94A3B8',
          muted:    '#4A5E80',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-cyan':   '0 0 20px rgba(0, 194, 255, 0.35)',
        'neon-blue':   '0 0 20px rgba(59, 130, 246, 0.35)',
        'neon-green':  '0 0 20px rgba(16, 185, 129, 0.35)',
        'neon-red':    '0 0 20px rgba(239, 68, 68, 0.35)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.35)',
        'neon-amber':  '0 0 20px rgba(245, 158, 11, 0.35)',
        'glass':       '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glass-lg':    '0 20px 60px rgba(0,0,0,0.6)',
        'card':        '0 4px 20px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'cyber-grid':  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231A2844' fill-opacity='0.35'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'cyber-dots':  "radial-gradient(rgba(0,194,255,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        'dots-sm': '24px 24px',
        'dots-md': '32px 32px',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slower':  'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':         'float 6s ease-in-out infinite',
        'scan-line':     'scanLine 2s linear infinite',
        'glow-pulse':    'glowPulse 2.5s ease-in-out infinite',
        'fade-in':       'fadeIn 0.4s ease forwards',
        'fade-in-scale': 'fadeInScale 0.35s cubic-bezier(.4,0,.2,1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        scanLine: {
          '0%':   { top: '0%' },
          '100%': { top: '100%' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,194,255,0.3)' },
          '50%':      { boxShadow: '0 0 30px rgba(0,194,255,0.7)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          from: { opacity: '0', transform: 'scale(0.93)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
