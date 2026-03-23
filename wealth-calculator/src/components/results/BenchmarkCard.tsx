interface BenchmarkCardProps {
  label: string
  value: string
  sublabel?: string
  delta?: number       // positive = above benchmark, negative = below
  deltaLabel?: string  // e.g. "vs national avg"
  onExplain?: () => void
  explanation?: string | null
  explaining?: boolean
}

function ArrowUpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

function ArrowDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  )
}

export function BenchmarkCard({
  label,
  value,
  sublabel,
  delta,
  deltaLabel,
  onExplain,
  explanation,
  explaining,
}: BenchmarkCardProps) {
  const hasDelta = delta !== undefined && delta !== null
  const isPositive = hasDelta && delta > 0
  const isNegative = hasDelta && delta < 0

  return (
    <div className="
      flex-1 min-w-0
      bg-surface dark:bg-surface-dark
      border border-border dark:border-border-dark
      rounded-xl p-4
      shadow-sm
    ">
      {/* Header row: label + optional explain button */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <p className="text-xs text-text-muted dark:text-text-muted-dark truncate">
          {label}
        </p>
        {onExplain && (
          <button
            onClick={onExplain}
            aria-label={`Explain ${label}`}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full
              text-text-muted dark:text-text-muted-dark
              hover:text-accent-violet dark:hover:text-accent-violet-dark
              hover:bg-surface-raised dark:hover:bg-surface-dark-raised
              transition-colors"
          >
            {explaining ? (
              <span
                className="w-2 h-2 rounded-full bg-accent-violet dark:bg-accent-violet-dark animate-pulse"
                aria-hidden="true"
              />
            ) : (
              <span className="text-xs font-semibold leading-none" aria-hidden="true">?</span>
            )}
          </button>
        )}
      </div>

      <p className="text-2xl font-bold font-mono text-text-primary dark:text-text-primary-dark leading-tight">
        {value}
      </p>

      {sublabel && (
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
          {sublabel}
        </p>
      )}

      {hasDelta && (
        <div className={`
          flex items-center gap-1 mt-2 text-xs font-medium
          ${isPositive ? 'text-accent-emerald dark:text-accent-emerald-dark' : ''}
          ${isNegative ? 'text-accent-rose dark:text-accent-rose-dark' : ''}
          ${!isPositive && !isNegative ? 'text-text-muted dark:text-text-muted-dark' : ''}
        `}>
          {isPositive && <ArrowUpIcon />}
          {isNegative && <ArrowDownIcon />}
          <span>
            {isPositive ? '+' : ''}{(delta * 100).toFixed(1)}%
            {deltaLabel && (
              <span className="font-normal text-text-muted dark:text-text-muted-dark ml-1">
                {deltaLabel}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Explanation text block */}
      {explanation && !explaining && (
        <div className="mt-2 border-t border-border dark:border-border-dark pt-2">
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark leading-relaxed">
            {explanation}
          </p>
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-accent-violet dark:text-accent-violet-dark opacity-80">
            Snowflake Cortex AI
          </span>
        </div>
      )}
    </div>
  )
}
