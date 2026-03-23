import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Tier1Inputs, Tier2Inputs, ActionItem } from '../../types'
import { useActionPlan } from '../../hooks/useCortex'
import { CortexBadge } from '../shared/CortexBadge'

interface AskCortexButtonProps {
  tier1: Tier1Inputs | null
  tier2: Tier2Inputs | null
  enabled: boolean
}

const BADGE_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-accent-blue/10 dark:bg-accent-blue-dark/10', text: 'text-accent-blue dark:text-accent-blue-dark' },
  2: { bg: 'bg-accent-amber/10 dark:bg-accent-amber-dark/10', text: 'text-accent-amber dark:text-accent-amber-dark' },
  3: { bg: 'bg-accent-emerald/10 dark:bg-accent-emerald-dark/10', text: 'text-accent-emerald dark:text-accent-emerald-dark' },
}

function SparkleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
    </svg>
  )
}

function ActionPlanModal({
  tier1,
  tier2,
  onClose,
}: {
  tier1: Tier1Inputs
  tier2: Tier2Inputs
  onClose: () => void
}) {
  const { data, loading, error, fetchPlan } = useActionPlan()
  const [hasFetched, setHasFetched] = useState(false)

  const handleGenerate = () => {
    setHasFetched(true)
    fetchPlan(tier1, tier2)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="AI Action Plan"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="
        relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto
        bg-surface dark:bg-surface-dark
        border border-border dark:border-border-dark
        border-l-4 border-l-accent-blue dark:border-l-accent-blue-dark
        rounded-2xl shadow-xl p-6
      ">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-2.5">
            <span className="text-accent-blue dark:text-accent-blue-dark mt-0.5"><SparkleIcon size={20} /></span>
            <div>
              <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">AI Action Plan</h2>
              <div className="mt-1">
                <CortexBadge size="md" />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted dark:text-text-muted-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors p-1"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Not yet fetched — show generate button */}
        {!hasFetched && !loading && !data && (
          <div className="text-center py-4">
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
              Get 3 personalized wealth-building recommendations based on your profile and current market conditions.
            </p>
            <button
              onClick={handleGenerate}
              className="
                px-6 py-2.5 rounded-lg text-sm font-medium
                bg-accent-blue dark:bg-accent-blue-dark text-white
                hover:opacity-90 transition-opacity
                flex items-center justify-center gap-2 mx-auto
              "
            >
              <SparkleIcon size={16} />
              Generate My Action Plan
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-5">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-raised dark:bg-surface-dark-raised flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-surface-raised dark:bg-surface-dark-raised rounded w-44" />
                    <div className="h-3 bg-surface-raised dark:bg-surface-dark-raised rounded w-full" />
                    <div className="h-3 bg-surface-raised dark:bg-surface-dark-raised rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted dark:text-text-muted-dark text-center">
              Analyzing with Cortex AI...
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-4">
            <p className="text-sm text-accent-rose dark:text-accent-rose-dark">Unable to generate recommendations</p>
            <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1">{error}</p>
            <button
              onClick={handleGenerate}
              className="mt-4 px-4 py-1.5 rounded-lg text-xs font-medium bg-accent-blue dark:bg-accent-blue-dark text-white hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {data && data.actions.length > 0 && !loading && (
          <>
            <div className="space-y-4">
              {data.actions.map((action: ActionItem) => {
                const colors = BADGE_COLORS[action.priority] ?? BADGE_COLORS[3]
                return (
                  <div key={action.priority} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold font-mono ${colors.bg} ${colors.text}`}>
                      {action.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">{action.title}</h3>
                      <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1 leading-relaxed">{action.explanation}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border dark:border-border-dark">
              <p className="text-xs text-text-muted dark:text-text-muted-dark flex-1">{data.disclaimer}</p>
              <button
                onClick={handleGenerate}
                className="ml-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-text-secondary dark:text-text-secondary-dark hover:bg-surface-raised dark:hover:bg-surface-dark-raised border border-border dark:border-border-dark transition-colors flex-shrink-0"
              >
                ↻ Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

export function AskCortexButton({ tier1, tier2, enabled }: AskCortexButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => enabled && setOpen(true)}
        disabled={!enabled}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-150
          ${enabled
            ? 'bg-accent-blue dark:bg-accent-blue-dark text-white hover:opacity-90 cursor-pointer'
            : 'bg-surface-raised dark:bg-surface-dark-raised text-text-muted dark:text-text-muted-dark cursor-not-allowed opacity-50'
          }
        `}
        title={enabled ? 'Get AI-powered financial recommendations' : 'Fill in your profile first'}
      >
        <SparkleIcon size={14} />
        Ask Cortex AI
      </button>

      {open && tier1 && tier2 && (
        <ActionPlanModal tier1={tier1} tier2={tier2} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
