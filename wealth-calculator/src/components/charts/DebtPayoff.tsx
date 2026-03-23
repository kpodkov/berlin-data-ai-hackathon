import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCompact, formatCurrency } from '../../utils/format'

interface DebtPayoffProps {
  creditCardDebt: number
  otherDebt: number
  // Monthly investment freed up if debt were eliminated
  monthlyDebtService: number
  // Years to project savings boost
  yearsHorizon: number
  // Annual return to use for projecting freed savings
  annualReturn: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      className="rounded-lg p-3 shadow-xl text-xs min-w-[160px] border"
      style={{ backgroundColor: 'var(--color-chart-tooltip-bg)', borderColor: 'var(--color-border)' }}
    >
      <p className="font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span style={{ color: 'var(--color-text-secondary)' }}>{entry.name}</span>
          </div>
          <span className="font-mono font-semibold" style={{ color: 'var(--color-chart-tooltip-text)' }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// Project how much the freed monthly debt service grows over a horizon
function projectDebtFreeSavings(
  monthlyService: number,
  annualReturn: number,
  years: number,
): number {
  if (monthlyService <= 0 || years <= 0) return 0
  const r = annualReturn / 12
  if (r === 0) return monthlyService * 12 * years
  return monthlyService * ((Math.pow(1 + r, years * 12) - 1) / r)
}

export function DebtPayoff({
  creditCardDebt,
  otherDebt,
  monthlyDebtService,
  yearsHorizon,
  annualReturn,
}: DebtPayoffProps) {
  const totalDebt = creditCardDebt + otherDebt
  const projectedSavings = projectDebtFreeSavings(monthlyDebtService, annualReturn, yearsHorizon)

  const data = [
    {
      name: 'Current Debt',
      value: totalDebt,
      color: 'var(--color-accent-rose)',
    },
    {
      name: `Projected Savings\n(debt-free)`,
      value: projectedSavings,
      color: 'var(--color-accent-emerald)',
    },
  ]

  const hasData = totalDebt > 0 || projectedSavings > 0

  if (!hasData) {
    return (
      <div className="
        bg-surface dark:bg-surface-dark
        border border-border dark:border-border-dark
        rounded-xl p-5 shadow-sm
      ">
        <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-1">
          Debt Impact
        </h3>
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
          No debt entered — great position to invest.
        </p>
      </div>
    )
  }

  return (
    <div className="
      bg-surface dark:bg-surface-dark
      border border-border dark:border-border-dark
      rounded-xl p-5 shadow-sm
    ">
      <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-1">
        Debt vs. Opportunity Cost
      </h3>
      <p className="text-xs text-text-secondary dark:text-text-secondary-dark mb-4">
        What your debt costs vs. what freed payments could grow to in {yearsHorizon} yrs
      </p>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-chart-grid)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={(v: number) => `€${formatCompact(v)}`}
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-text-muted dark:text-text-muted-dark mt-2 text-center">
        Debt-free projection assumes freed €{Math.round(monthlyDebtService).toLocaleString()}/mo invested · {(annualReturn * 100).toFixed(1)}% annual return
      </p>
    </div>
  )
}
