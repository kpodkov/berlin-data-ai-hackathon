import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { RiskTolerance } from '../../types'
import { getAllocation } from '../../engine/allocation'

interface AllocationPieProps {
  riskTolerance: RiskTolerance
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: { color: string }
  }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-xl text-xs border"
      style={{ backgroundColor: 'var(--color-chart-tooltip-bg)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span style={{ color: 'var(--color-text-secondary)' }}>{entry.name}</span>
        <span className="font-mono font-semibold ml-1" style={{ color: 'var(--color-chart-tooltip-text)' }}>{entry.value}%</span>
      </div>
    </div>
  )
}

const RISK_LABELS: Record<RiskTolerance, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
}

export function AllocationPie({ riskTolerance }: AllocationPieProps) {
  const allocation = getAllocation(riskTolerance)

  const data = [
    {
      name: `${allocation.equityTicker} (Equity)`,
      value: Math.round(allocation.equityWeight * 100),
      color: 'var(--color-accent-blue)',
    },
    {
      name: `${allocation.bondTicker} (Bonds)`,
      value: Math.round(allocation.bondWeight * 100),
      color: 'var(--color-accent-amber)',
    },
  ]

  return (
    <div className="
      bg-surface dark:bg-surface-dark
      border border-border dark:border-border-dark
      rounded-xl p-5 shadow-sm
    ">
      <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-1">
        Portfolio Allocation
      </h3>
      <p className="text-xs text-text-secondary dark:text-text-secondary-dark mb-4">
        {RISK_LABELS[riskTolerance]} strategy · based on risk tolerance
      </p>

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-text-secondary dark:text-text-secondary-dark">
                  {entry.name}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-text-primary dark:text-text-primary-dark">
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
