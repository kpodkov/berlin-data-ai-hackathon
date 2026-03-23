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
import type { InflationBreakdown } from '../../types'

interface InflationBreakdownProps {
  categories: InflationBreakdown['categories']
}

// Recharts CustomTooltip
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
      className="rounded-lg p-3 shadow-xl text-xs min-w-[180px] border"
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
            <span style={{ color: 'var(--color-text-secondary)' }} className="capitalize">{entry.name}</span>
          </div>
          <span className="font-mono font-semibold" style={{ color: 'var(--color-chart-tooltip-text)' }}>
            {entry.value.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}

// Chart colors
const COLOR_USER = 'var(--color-accent-violet)'
const COLOR_NATIONAL = 'var(--color-text-muted)'

export function InflationBreakdown({ categories }: InflationBreakdownProps) {
  // Recharts horizontal bar chart — layout="vertical" puts categories on Y axis
  const data = categories.map((cat) => ({
    name: cat.name,
    'Your rate': parseFloat(cat.userRate.toFixed(3)),
    'National': parseFloat(cat.nationalRate.toFixed(3)),
    userExceedsNational: cat.userRate > cat.nationalRate,
  }))

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-text-secondary dark:text-text-secondary-dark">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm inline-block" style={{ backgroundColor: COLOR_USER }} />
          <span>Your weighted rate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm inline-block" style={{ backgroundColor: COLOR_NATIONAL }} />
          <span>National rate</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
          barCategoryGap="30%"
          barGap={3}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-chart-grid)"
            horizontal={false}
          />

          <XAxis
            type="number"
            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
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
            width={90}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(139,92,246,0.05)' }}
          />

          <Bar dataKey="Your rate" radius={[0, 3, 3, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`user-${index}`}
                fill={COLOR_USER}
                opacity={entry.userExceedsNational ? 1 : 0.6}
              />
            ))}
          </Bar>

          <Bar dataKey="National" fill={COLOR_NATIONAL} opacity={0.7} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-text-muted dark:text-text-muted-dark mt-2 text-center">
        Brighter violet bars indicate categories where your costs outpace the national rate
      </p>
    </div>
  )
}
