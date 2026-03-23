import { ReactNode } from 'react'
import type { TierState } from '../../types'

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

interface TierCardProps {
  tier: 1 | 2 | 3
  title: string
  description: string
  state: TierState
  children?: ReactNode
}

const TIER_LABELS: Record<number, string> = {
  1: '01',
  2: '02',
  3: '03',
}

export function TierCard({ tier, title, description, state, children }: TierCardProps) {
  const isLocked = state === 'locked'
  const isComplete = state === 'complete'

  return (
    <div
      className={`
        rounded-xl border p-5 transition-all duration-200
        ${isLocked
          ? 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark opacity-50 pointer-events-none select-none'
          : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark shadow-sm'
        }
        ${isComplete ? 'border-accent-emerald/40 dark:border-accent-emerald/30' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Tier badge */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          text-xs font-bold font-mono
          ${isComplete
            ? 'bg-accent-emerald text-white dark:bg-accent-emerald-dark'
            : isLocked
              ? 'bg-surface-raised dark:bg-surface-dark-raised text-text-muted dark:text-text-muted-dark'
              : 'bg-accent-blue/10 dark:bg-accent-blue/10 text-accent-blue dark:text-accent-blue-dark'
          }
        `}>
          {isComplete ? <CheckIcon /> : TIER_LABELS[tier]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
              {title}
            </h3>
            {isLocked && (
              <span className="text-text-muted dark:text-text-muted-dark">
                <LockIcon />
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Content */}
      {!isLocked && children && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}
