import { useState, useEffect, useRef } from 'react'
import type { ConsumerInsights as ConsumerInsightsData, ConsumerTierStats } from '../../types'
import { CortexBadge } from '../shared/CortexBadge'

interface ConsumerInsightsProps {
  income: number
}

const TIER_ORDER = ['Budget', 'Middle', 'Affluent', 'Premium']

const TIER_COLORS: Record<string, string> = {
  Budget:   'bg-text-muted dark:bg-text-muted-dark text-white',
  Middle:   'bg-accent-blue dark:bg-accent-blue-dark text-white',
  Affluent: 'bg-accent-amber dark:bg-accent-amber-dark text-white',
  Premium:  'bg-accent-emerald dark:bg-accent-emerald-dark text-white',
}

const TIER_BAR_COLORS: Record<string, string> = {
  Budget:   'bg-text-muted/50 dark:bg-text-muted-dark/50',
  Middle:   'bg-accent-blue/60 dark:bg-accent-blue-dark/60',
  Affluent: 'bg-accent-amber dark:bg-accent-amber-dark',
  Premium:  'bg-accent-emerald/80 dark:bg-accent-emerald-dark/80',
}

const TIER_BAR_ACTIVE: Record<string, string> = {
  Budget:   'bg-text-muted dark:bg-text-muted-dark',
  Middle:   'bg-accent-blue dark:bg-accent-blue-dark',
  Affluent: 'bg-accent-amber dark:bg-accent-amber-dark',
  Premium:  'bg-accent-emerald dark:bg-accent-emerald-dark',
}

function SkeletonLine({ wide }: { wide?: boolean }) {
  return (
    <div className={`h-3 rounded animate-pulse bg-border dark:bg-border-dark ${wide ? 'w-3/4' : 'w-1/2'}`} />
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <SkeletonLine />
        <div className="h-5 w-16 rounded-full animate-pulse bg-border dark:bg-border-dark" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-16 h-3 rounded animate-pulse bg-border dark:bg-border-dark" />
            <div
              className="h-3 rounded animate-pulse bg-border dark:bg-border-dark"
              style={{ width: `${30 + i * 15}%` }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <SkeletonLine />
            <SkeletonLine wide />
          </div>
        ))}
      </div>
    </div>
  )
}

function TierBadge({ tier, active }: { tier: string; active: boolean }) {
  const base = active ? TIER_COLORS[tier] ?? 'bg-text-muted text-white' : ''
  const inactive = 'bg-surface-raised dark:bg-surface-dark-raised text-text-secondary dark:text-text-secondary-dark'
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
      ${active ? base : inactive}
    `}>
      {tier}
    </span>
  )
}

function TierDistributionBar({
  tiers,
  userTier,
}: {
  tiers: ConsumerTierStats[]
  userTier: string
}) {
  const sorted = TIER_ORDER.map((name) => tiers.find((t) => t.wealthTier === name)).filter(Boolean) as ConsumerTierStats[]
  const total = sorted.reduce((sum, t) => sum + (t.totalUsers ?? 0), 0)
  if (total === 0) return null

  return (
    <div className="space-y-1.5">
      {sorted.map((t) => {
        const pct = total > 0 ? (t.totalUsers / total) * 100 : 0
        const isActive = t.wealthTier === userTier
        const barClass = isActive
          ? (TIER_BAR_ACTIVE[t.wealthTier] ?? 'bg-accent-amber dark:bg-accent-amber-dark')
          : (TIER_BAR_COLORS[t.wealthTier] ?? 'bg-border dark:bg-border-dark')

        return (
          <div key={t.wealthTier} className="flex items-center gap-2 text-xs">
            <span className={`w-16 shrink-0 font-medium ${isActive ? 'text-text-primary dark:text-text-primary-dark' : 'text-text-secondary dark:text-text-secondary-dark'}`}>
              {t.wealthTier}
            </span>
            <div className="flex-1 h-2 rounded-full bg-border dark:bg-border-dark overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                style={{ width: `${pct.toFixed(1)}%` }}
              />
            </div>
            <span className={`w-10 text-right font-mono ${isActive ? 'text-text-primary dark:text-text-primary-dark' : 'text-text-muted dark:text-text-muted-dark'}`}>
              {pct.toFixed(0)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wide text-text-muted dark:text-text-muted-dark font-medium">
        {label}
      </p>
      <p className="text-xs font-medium text-text-primary dark:text-text-primary-dark leading-snug">
        {value}
      </p>
    </div>
  )
}

export function ConsumerInsights({ income }: ConsumerInsightsProps) {
  const [data, setData] = useState<ConsumerInsightsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (income <= 0) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/consumer-insights?income=${income}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: ConsumerInsightsData = await res.json()
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [income])

  return (
    <div className="
      bg-surface dark:bg-surface-dark
      border border-border dark:border-border-dark
      border-l-4 border-l-accent-amber dark:border-l-accent-amber-dark
      rounded-xl p-5 shadow-sm space-y-5
    ">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
              Consumer Intelligence
            </h3>
            {data && (
              <TierBadge tier={data.userTier} active />
            )}
          </div>
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
            {data ? `Based on ${data.totalUsers.toLocaleString()} sampled JustWatch users` : 'Loading consumer data...'}
          </p>
        </div>
        <CortexBadge size="md" />
      </div>

      {loading && <LoadingSkeleton />}

      {error && (
        <p className="text-xs text-accent-rose dark:text-accent-rose-dark">
          Could not load consumer data: {error}
        </p>
      )}

      {!loading && data && (
        <div className="space-y-5">
          {/* Tier distribution */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted dark:text-text-muted-dark font-medium mb-2">
              Wealth tier distribution
            </p>
            <TierDistributionBar tiers={data.tiers} userTier={data.userTier} />
          </div>

          {/* Stats for user's tier */}
          {(() => {
            const myTier = data.tiers.find((t) => t.wealthTier === data.userTier)
            if (!myTier) return null
            return (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-text-muted dark:text-text-muted-dark font-medium mb-2">
                  Your tier — {data.userTier}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <StatItem
                    label="Dominant concern"
                    value={myTier.dominantConcern}
                  />
                  <StatItem
                    label="Typical spending"
                    value={myTier.typicalSpending}
                  />
                  <StatItem
                    label="Macro regime"
                    value={myTier.macroRegime}
                  />
                  <StatItem
                    label="Avg financial score"
                    value={myTier.avgFinancialScore != null ? `${myTier.avgFinancialScore} / 100` : null}
                  />
                  {data.consumerConfidence?.confidenceRatio != null && (
                    <StatItem
                      label="Consumer confidence index"
                      value={`${data.consumerConfidence.confidenceRatio}%`}
                    />
                  )}
                  <StatItem
                    label="Users in tier"
                    value={myTier.totalUsers?.toLocaleString()}
                  />
                </div>
              </div>
            )
          })()}

          {/* Top segments */}
          {data.topSegments.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-muted dark:text-text-muted-dark font-medium mb-2">
                Top segments in your tier
              </p>
              <div className="space-y-1.5">
                {data.topSegments.slice(0, 5).map((seg) => (
                  <div key={seg.segment} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-secondary dark:text-text-secondary-dark truncate">
                      {seg.segment}
                    </span>
                    <span className="font-mono text-text-muted dark:text-text-muted-dark shrink-0">
                      {seg.users?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EU macro context */}
          {data.euContext && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-muted dark:text-text-muted-dark font-medium mb-2">
                EU macro context
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <StatItem
                  label="EUR/USD rate"
                  value={
                    data.euContext.eurUsdRate != null
                      ? `${Number(data.euContext.eurUsdRate).toFixed(4)}${data.euContext.eurUsdTrend ? ` · ${data.euContext.eurUsdTrend}` : ''}`
                      : null
                  }
                />
                <StatItem
                  label="EU inflation"
                  value={
                    data.euContext.euInflationRate != null
                      ? `${Number(data.euContext.euInflationRate).toFixed(2)}%`
                      : null
                  }
                />
                <StatItem
                  label="ECB deposit rate"
                  value={
                    data.euContext.ecbDepositRate != null
                      ? `${Number(data.euContext.ecbDepositRate).toFixed(2)}%`
                      : null
                  }
                />
              </div>
            </div>
          )}

          {/* Source attribution */}
          <p className="text-[10px] text-text-muted dark:text-text-muted-dark border-t border-border dark:border-border-dark pt-3">
            {data.source}
          </p>
        </div>
      )}
    </div>
  )
}
