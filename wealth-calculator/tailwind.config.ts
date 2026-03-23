import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        background: {
          DEFAULT: '#F7F8FC',
          dark: '#0D0F1A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#EEF0F8',
          dark: '#161827',
          'dark-raised': '#1E2236',
        },
        border: {
          DEFAULT: '#DDE1EE',
          focus: '#4F63FF',
          dark: '#2D3154',
          'dark-focus': '#6B7EFF',
        },
        'text-primary': {
          DEFAULT: '#111827',
          dark: '#F1F5F9',
        },
        'text-secondary': {
          DEFAULT: '#6B7280',
          dark: '#94A3B8',
        },
        'text-muted': {
          DEFAULT: '#9CA3AF',
          dark: '#64748B',
        },
        'accent-blue': {
          DEFAULT: '#4F63FF',
          dark: '#6B7EFF',
        },
        'accent-emerald': {
          DEFAULT: '#10B981',
          dark: '#34D399',
        },
        'accent-amber': {
          DEFAULT: '#F59E0B',
          dark: '#FBBF24',
        },
        'accent-rose': {
          DEFAULT: '#F43F5E',
          dark: '#FB7185',
        },
        'accent-violet': {
          DEFAULT: '#8B5CF6',
          dark: '#A78BFA',
        },
        'chart-grid': {
          DEFAULT: '#E5E7EB',
          dark: '#1E2236',
        },
      },
    },
  },
  plugins: [forms],
}

export default config
