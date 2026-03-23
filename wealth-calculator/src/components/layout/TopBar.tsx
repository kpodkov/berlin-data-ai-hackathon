import { ReactNode } from 'react'
import { PrivacyBadge } from './PrivacyBadge'
import { SentimentBadge } from './SentimentBadge'
import { ThemeToggle } from './ThemeToggle'

interface TopBarProps {
  dark: boolean
  onToggleDark: () => void
  cortexButton?: ReactNode
}

export function TopBar({ dark, onToggleDark, cortexButton }: TopBarProps) {
  return (
    <header className="
      sticky top-0 z-40
      border-b border-border dark:border-border-dark
      bg-surface/90 dark:bg-surface-dark/90
      backdrop-blur-sm
    ">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark tracking-tight whitespace-nowrap">
            Wealth Calculator
          </h1>
          <span className="hidden sm:block text-xs text-text-muted dark:text-text-muted-dark font-mono">
            powered by FRED
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {cortexButton}
          <SentimentBadge />
          <PrivacyBadge />
          <ThemeToggle dark={dark} onToggle={onToggleDark} />
        </div>
      </div>
    </header>
  )
}
