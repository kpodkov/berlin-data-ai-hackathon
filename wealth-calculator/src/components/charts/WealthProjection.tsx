import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ProjectionResult } from '../../types'
import { formatCompact, formatCurrency } from '../../utils/format'

interface WealthProjectionProps {
  projection: ProjectionResult
  currentAge: number
}

interface ChartDataPoint {
  age: number
  conservative: number
  moderate: number
  aggressive: number
}

// Recharts CustomTooltip
interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: number
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      className="rounded-lg p-3 shadow-xl text-xs min-w-[160px] border"
      style={{ backgroundColor: 'var(--color-chart-tooltip-bg)', borderColor: 'var(--color-border)' }}
    >
      <p className="font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Age {label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span style={{ color: 'var(--color-text-secondary)' }} className="capitalize">{entry.name}</span>
          </div>
          <span className="font-mono font-semibold" style={{ color: 'var(--color-chart-tooltip-text)' }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// Merge the three projection arrays into one chart data structure
// Empty arrays produce undefined values (not 0) so Recharts hides those series
function buildChartData(projection: ProjectionResult): ChartDataPoint[] {
  const { conservative, moderate, aggressive } = projection
  const len = Math.max(conservative.length, moderate.length, aggressive.length)
  const result: ChartDataPoint[] = []

  for (let i = 0; i < len; i++) {
    const c = conservative[i]
    const m = moderate[i]
    const a = aggressive[i]
    const age = c?.age ?? m?.age ?? a?.age ?? 0
    result.push({
      age,
      conservative: c ? c.nominal : undefined as unknown as number,
      moderate: m ? m.nominal : undefined as unknown as number,
      aggressive: a ? a.nominal : undefined as unknown as number,
    })
  }

  return result
}

// Only show X-axis ticks at 5-year intervals
function xAxisTicks(data: ChartDataPoint[]): number[] {
  const ages = data.map((d) => d.age)
  const first = ages[0] ?? 0
  // Round up to next 5-year boundary from the start
  const startTick = first % 5 === 0 ? first : first + (5 - (first % 5))
  const last = ages[ages.length - 1] ?? 70
  const ticks: number[] = []
  for (let age = startTick; age <= last; age += 5) {
    ticks.push(age)
  }
  return ticks
}

export function WealthProjection({ projection, currentAge }: WealthProjectionProps) {
  const data = buildChartData(projection)
  const ticks = xAxisTicks(data)

  // CSS variables for chart colors — resolved at runtime so dark mode works
  const colors = {
    conservative: 'var(--color-accent-blue)',
    moderate:     'var(--color-accent-amber)',
    aggressive:   'var(--color-accent-rose)',
    grid:         'var(--color-chart-grid)',
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-text-secondary dark:text-text-secondary-dark">
        {[
          { key: 'conservative', label: 'Conservative', color: colors.conservative },
          { key: 'moderate',     label: 'Moderate',     color: colors.moderate },
          { key: 'aggressive',   label: 'Aggressive',   color: colors.aggressive },
        ].map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradConservative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.conservative} stopOpacity={0.15} />
              <stop offset="100%" stopColor={colors.conservative} stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gradModerate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.moderate} stopOpacity={0.15} />
              <stop offset="100%" stopColor={colors.moderate} stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gradAggressive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.aggressive} stopOpacity={0.15} />
              <stop offset="100%" stopColor={colors.aggressive} stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.grid}
            vertical={false}
          />

          <XAxis
            dataKey="age"
            ticks={ticks}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'Age',
              position: 'insideBottomRight',
              offset: -4,
              fontSize: 11,
              fill: 'var(--color-text-muted)',
            }}
          />

          <YAxis
            tickFormatter={(v: number) => `€${formatCompact(v)}`}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '4 2' }}
          />

          <Area
            type="monotone"
            dataKey="conservative"
            stroke={colors.conservative}
            strokeWidth={2}
            fill="url(#gradConservative)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="moderate"
            stroke={colors.moderate}
            strokeWidth={2}
            fill="url(#gradModerate)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="aggressive"
            stroke={colors.aggressive}
            strokeWidth={2}
            fill="url(#gradAggressive)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Projection note */}
      <p className="text-xs text-text-muted dark:text-text-muted-dark mt-3 text-center">
        Projections from age {currentAge} to 70 · nominal values · based on historical ETF returns
      </p>
    </div>
  )
}
