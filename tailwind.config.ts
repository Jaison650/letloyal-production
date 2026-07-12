import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '375px',   // iPhone SE / small Android
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          dark: '#134E4A',
          light: '#CCFBF1',
        },
        accent: {
          DEFAULT: '#5EEAD4',
          mid: '#14B8A6',
          muted: 'rgba(94,234,212,0.15)',
        },
        brand: {
          bg: '#F8FAFC',
          white: '#FFFFFF',
          border: '#E2E8F0',
          navy: '#0F172A',
        },
        text: {
          dark: '#0F172A',
          medium: '#64748B',
          light: '#94A3B8',
        },
        status: {
          success: '#2E7D32',
          warning: '#F57C00',
          error: '#D32F2F',
        },
        surface: {
          page: 'var(--surface-page)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          sub: 'var(--text-secondary)',
          faint: 'var(--text-tertiary)',
        },
        stroke: {
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        teal: {
          DEFAULT: 'var(--accent-default)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          fg: 'var(--accent-fg)',
          // numeric steps kept — used by existing bg-gradient-to-br ... to-teal-500/600 in
          // src/components/merchant/RedemptionValidator.tsx and src/components/customer/MilestoneCard.tsx
          500: '#14b8a6',
          600: '#0d9488',
        },
        reward: {
          DEFAULT: 'var(--reward)',
          deep: 'var(--reward-deep)',
          subtle: 'var(--reward-subtle)',
          fg: 'var(--reward-fg)',
        },
        good: { DEFAULT: 'var(--success)', subtle: 'var(--success-subtle)' },
        warn: { DEFAULT: 'var(--warning)', subtle: 'var(--warning-subtle)' },
        bad: { DEFAULT: 'var(--error)', subtle: 'var(--error-subtle)' },
        note: { DEFAULT: 'var(--info)', subtle: 'var(--info-subtle)' },
        'section-dark': 'var(--section-dark)',
      },
      fontSize: {
        display: ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        h1: ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '800' }],
        h2: ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        h3: ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '700' }],
        h4: ['1.0625rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'body-lg': ['1.03125rem', { lineHeight: '1.6' }],
        body: ['0.90625rem', { lineHeight: '1.55' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
        label: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.08em', fontWeight: '700' }],
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        // legacy alias so existing `font-jakarta` classes keep working (now renders Manrope)
        jakarta: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '14px',
        '3xl': '28px',
        '4xl': '36px',
      },
      boxShadow: {
        card: '0 4px 25px rgba(13,148,136,0.08)',
        'card-hover': '0 8px 40px rgba(13,148,136,0.15)',
        btn: '0 8px 25px rgba(94,234,212,0.30)',
        'btn-hover': '0 12px 30px rgba(94,234,212,0.40)',
        ds: 'var(--shadow-card)',
        ring: '0 0 0 3px var(--ring)',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'count-up': 'countUp 1.2s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'progress-fill': 'progressFill 0.8s ease-out',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(94,234,212,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(94,234,212,0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        progressFill: {
          '0%': { width: '0%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
