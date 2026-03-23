interface PersonalInflationCardProps {
  personalRate: number
  nationalRate: number
}

export function PersonalInflationCard({ personalRate, nationalRate }: PersonalInflationCardProps) {
  const delta = personalRate - nationalRate
  const isHigher = delta > 0
  const isLower = delta < 0

  const deltaColor = isHigher
    ? 'text-accent-rose dark:text-accent-rose-dark'
    : isLower
      ? 'text-accent-emerald dark:text-accent-emerald-dark'
      : 'text-text-secondary dark:text-text-secondary-dark'

  const deltaText = isHigher
    ? `Your costs are rising ${Math.abs(delta).toFixed(2)}% faster than average`
    : isLower
      ? `Your costs are rising ${Math.abs(delta).toFixed(2)}% slower than average`
      : 'Your inflation rate matches the national average'

  return (
    <div className="
      bg-surface dark:bg-surface-dark
      border border-border dark:border-border-dark
      rounded-xl p-5 shadow-sm
    ">
      <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-4">
        Your Inflation Rate
      </h2>

      <div className="flex items-stretch gap-4">
        {/* Personal rate */}
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide">
            Your rate
          </span>
          <span className="font-mono text-3xl font-bold text-accent-violet dark:text-accent-violet-dark leading-none">
            {personalRate.toFixed(2)}%
          </span>
        </div>

        {/* Divider */}
        <div className="w-px bg-border dark:bg-border-dark self-stretch" />

        {/* National rate */}
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide">
            National average
          </span>
          <span className="font-mono text-3xl font-bold text-text-secondary dark:text-text-secondary-dark leading-none">
            {nationalRate.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Delta text */}
      <p className={`mt-4 text-sm font-medium ${deltaColor}`}>
        {deltaText}
      </p>
    </div>
  )
}
