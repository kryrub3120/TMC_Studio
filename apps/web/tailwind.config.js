/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design token colors via CSS variables
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surface2: 'var(--color-surface2)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        pitch: 'var(--color-pitch)',
        'pitch-lines': 'var(--color-pitch-lines)',
        
        // Team colors (static)
        'team-home': '#e63946',
        'team-away': '#457b9d',
        'team-home-light': '#f87171',
        'team-away-light': '#60a5fa',
        ball: '#ffffff',
        selection: '#ffd60a',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        canvas: 'var(--shadow-canvas)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
      zIndex: {
        canvas: 'var(--z-canvas)',
        inspector: 'var(--z-inspector)',
        topbar: 'var(--z-topbar)',
        bottombar: 'var(--z-bottombar)',
        cheatsheet: 'var(--z-cheatsheet)',
        toast: 'var(--z-toast)',
        modal: 'var(--z-modal)',
        palette: 'var(--z-palette)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.5rem' }],
        lg: ['1rem', { lineHeight: '1.75rem' }],
        xl: ['1.125rem', { lineHeight: '1.75rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease',
        'slide-up': 'slideUp 200ms ease',
        'slide-down': 'slideDown 200ms ease',
        'toast': 'toastSlide 1.2s ease forwards',
      },
    },
  },
  plugins: [],
};
