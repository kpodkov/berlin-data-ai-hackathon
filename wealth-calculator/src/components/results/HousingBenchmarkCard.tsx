interface HousingBenchmarkCardProps {
  housingBurdenPct: number   // 0-100, % of income going to housing
  monthlyHousingCost: number
  monthlyIncome: number
}

export function HousingBenchmarkCard({
  housingBurdenPct,
  monthlyHousingCost,
  monthlyIncome,
}: HousingBenchmarkCardProps) {
  const isHealthy  = housingBurdenPct < 30
  const isBurdened = housingBurdenPct >= 30 && housingBurdenPct < 50

  const colorClass = isHealthy
    ? 'text-accent-emerald dark:text-accent-emerald-dark'
    : isBurdened
      ? 'text-accent-amber dark:text-accent-amber-dark'
      : 'text-accent-rose dark:text-accent-rose-dark'

  const barColor = isHealthy
    ? 'bg-accent-emerald dark:bg-accent-emerald-dark'
    : isBurdened
      ? 'bg-accent-amber dark:bg-accent-amber-dark'
      : 'bg-accent-rose dark:bg-accent-rose-dark'

  const statusLabel = isHealthy
    ? 'Within healthy range'
    : isBurdened
      ? 'Cost-burdened (>30%)'
      : 'Severely burdened (>50%)'

  // Clamp bar width at 100%
  const barWidth = Math.min(100, housingBurdenPct)

  return (
    <div className="
      flex-1 min-w-0
      bg-surface dark:bg-surface-dark
      border border-border dark:border-border-dark
      rounded-xl p-4 shadow-sm
    ">
      <p className="text-xs text-text-muted dark:text-text-muted-dark mb-1 truncate">
        Housing Burden
      </p>
      <p className={`text-2xl font-bold font-mono leading-tight ${colorClass}`}>
        {housingBurdenPct.toFixed(1)}%
      </p>
      <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
        {statusLabel}
      </p>

      {/* Progress bar */}
      <div className="mt-3 space-y-1">
        <div className="h-1.5 w-full rounded-full bg-surface-raised dark:bg-surface-dark-raised overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-text-muted dark:text-text-muted-dark">
          <span>0%</span>
          <span className="text-accent-emerald dark:text-accent-emerald-dark">30%</span>
          <span className="text-accent-amber dark:text-accent-amber-dark">50%</span>
          <span>100%</span>
        </div>
      </div>

      {monthlyIncome > 0 && (
        <p className="text-[10px] text-text-muted dark:text-text-muted-dark mt-2">
          ${Math.round(monthlyHousingCost).toLocaleString()} of ${Math.round(monthlyIncome).toLocaleString()} monthly income
        </p>
      )}
    </div>
  )
}
