import { formatPercent } from '../../utils/format'

interface SavingsRateComparisonCardProps {
  monthlyInvestment: number
  annualIncome: number
  nationalSavingsRate: number   // as a decimal, e.g. 0.035
  recommendedRate?: number      // as a decimal, default 0.15
}

const RECOMMENDED_RATE = 0.15

export function SavingsRateComparisonCard({
  monthlyInvestment,
  annualIncome,
  nationalSavingsRate,
  recommendedRate = RECOMMENDED_RATE,
}: SavingsRateComparisonCardProps) {
  const monthlyIncome = annualIncome / 12
  const userRate = monthlyIncome > 0 ? monthlyInvestment / monthlyIncome : 0

  // For the bar, scale to recommended * 1.5 as the 100% mark
  const maxRate = Math.max(recommendedRate * 1.5, userRate * 1.1, 0.25)

  const userPct       = Math.min(100, (userRate / maxRate) * 100)
  const nationalPct   = Math.min(100, (nationalSavingsRate / maxRate) * 100)
  const recommendedPct = Math.min(100, (recommendedRate / maxRate) * 100)

  const aboveRecommended = userRate >= recommendedRate
  const aboveNational    = userRate >= nationalSavingsRate

  const barColor = aboveRecommended
    ? 'bg-accent-emerald dark:bg-accent-emerald-dark'
    : aboveNational
      ? 'bg-accent-amber dark:bg-accent-amber-dark'
      : 'bg-accent-rose dark:bg-accent-rose-dark'

  const valueColor = aboveRecommended
    ? 'text-accent-emerald dark:text-accent-emerald-dark'
    : aboveNational
      ? 'text-accent-amber dark:text-accent-amber-dark'
      : 'text-accent-rose dark:text-accent-rose-dark'

  return (
    <div className="
      flex-1 min-w-0
      bg-surface dark:bg-surface-dark
      border border-border dark:border-border-dark
      rounded-xl p-4 shadow-sm
    ">
      <p className="text-xs text-text-muted dark:text-text-muted-dark mb-1">
        Savings Rate
      </p>
      <p className={`text-2xl font-bold font-mono leading-tight ${valueColor}`}>
        {formatPercent(userRate)}
      </p>
      <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
        {aboveRecommended
          ? 'Above recommended rate'
          : aboveNational
            ? 'Above national average'
            : 'Below national average'}
      </p>

      {/* Bar with tick marks */}
      <div className="mt-3 space-y-0.5">
        <div className="relative h-2 w-full rounded-full bg-surface-raised dark:bg-surface-dark-raised overflow-visible">
          {/* User rate bar */}
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${userPct}%` }}
          />

          {/* National average tick */}
          <div
            className="absolute top-[-3px] w-0.5 h-[14px] bg-text-muted dark:bg-text-muted-dark rounded-full"
            style={{ left: `${nationalPct}%` }}
          />

          {/* Recommended tick */}
          <div
            className="absolute top-[-3px] w-0.5 h-[14px] bg-accent-blue dark:bg-accent-blue-dark rounded-full"
            style={{ left: `${recommendedPct}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 pt-1.5 text-[10px] text-text-muted dark:text-text-muted-dark">
          <div className="flex items-center gap-1">
            <span className="w-1 h-2.5 rounded-full bg-text-muted dark:bg-text-muted-dark inline-block" />
            <span>National avg {formatPercent(nationalSavingsRate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-2.5 rounded-full bg-accent-blue dark:bg-accent-blue-dark inline-block" />
            <span>Recommended {formatPercent(recommendedRate)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
