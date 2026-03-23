import { useState } from 'react'
import type { Tier1Inputs, Tier3Inputs, ApiBenchmarks } from '../../types'
import { analyzeInflation } from '../../engine/inflation'
import { retirementHorizon } from '../../engine/projection'
import { PersonalInflationCard } from './PersonalInflationCard'
import { RealVsNominalToggle } from './RealVsNominalToggle'
import { InflationBreakdown } from '../charts/InflationBreakdown'
import { formatCurrency } from '../../utils/format'

interface Tier3ResultsProps {
  tier1: Tier1Inputs
  tier3: Tier3Inputs
  benchmarks: ApiBenchmarks
}

export function Tier3Results({ tier1, tier3, benchmarks }: Tier3ResultsProps) {
  const [projection, setProjection] = useState<'nominal' | 'real'>('nominal')

  const spending = {
    food:       tier3.monthlyFood,
    transport:  tier3.monthlyTransport,
    healthcare: tier3.monthlyHealthcare,
    education:  tier3.monthlyEducation,
    energy:     tier3.monthlyEnergy,
  }

  const yearsToRetire = retirementHorizon(tier1.age)

  const breakdown = analyzeInflation(
    spending,
    benchmarks.inflation,
    yearsToRetire,
  )

  const totalMonthlySpend =
    tier3.monthlyFood +
    tier3.monthlyTransport +
    tier3.monthlyHealthcare +
    tier3.monthlyEducation +
    tier3.monthlyEnergy

  return (
    <div className="space-y-6">
      {/* Personal vs national inflation */}
      <PersonalInflationCard
        personalRate={breakdown.personalRate}
        nationalRate={breakdown.nationalRate}
      />

      {/* Category breakdown chart */}
      <div className="
        bg-surface dark:bg-surface-dark
        border border-border dark:border-border-dark
        rounded-xl p-5 shadow-sm
      ">
        <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-1">
          Inflation by Category
        </h2>
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark mb-5">
          Your weighted contribution vs. the national rate per category
        </p>
        <InflationBreakdown categories={breakdown.categories} />
      </div>

      {/* Nominal / Real toggle + projection note */}
      <div className="
        bg-surface dark:bg-surface-dark
        border border-border dark:border-border-dark
        rounded-xl p-5 shadow-sm
      ">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
              Projection View
            </h2>
            <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
              Switch the wealth chart between nominal and real values
            </p>
          </div>
          <RealVsNominalToggle value={projection} onChange={setProjection} />
        </div>

        <div className="
          rounded-lg px-4 py-3
          bg-accent-violet/5 dark:bg-accent-violet/10
          border border-accent-violet/20 dark:border-accent-violet/20
          text-xs text-text-secondary dark:text-text-secondary-dark
          space-y-1
        ">
          <p>
            <span className="font-semibold text-accent-violet dark:text-accent-violet-dark">
              {projection === 'nominal' ? 'Nominal' : 'Real (inflation-adjusted)'}
            </span>
            {projection === 'nominal'
              ? ' — values shown in today\'s dollars without adjusting for inflation.'
              : ' — values adjusted for your personal inflation rate of ' + breakdown.personalRate.toFixed(2) + '% per year.'}
          </p>
          {projection === 'real' && (
            <p>
              At your personal rate, {formatCurrency(totalMonthlySpend * 12)} of annual spending
              today will cost approximately{' '}
              <span className="font-semibold text-text-primary dark:text-text-primary-dark">
                {formatCurrency((totalMonthlySpend * 12) * Math.pow(1 + breakdown.personalRate / 100, yearsToRetire))}
              </span>{' '}
              per year by retirement.
            </p>
          )}
        </div>
      </div>

      {/* Worst category callout */}
      {breakdown.worstCategory && (
        <div className="
          bg-surface dark:bg-surface-dark
          border border-border dark:border-border-dark
          rounded-xl p-5 shadow-sm
        ">
          <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-3">
            Purchasing Power Insight
          </h2>
          <div className="space-y-3 text-sm text-text-secondary dark:text-text-secondary-dark">
            <p>
              <span className="font-semibold text-accent-rose dark:text-accent-rose-dark">
                {breakdown.worstCategory}
              </span>{' '}
              has the highest national inflation rate among your spending categories.
            </p>
            {totalMonthlySpend > 0 && (
              <p>
                Over your {yearsToRetire}-year retirement horizon, your current spending basket
                of{' '}
                <span className="font-semibold text-text-primary dark:text-text-primary-dark font-mono">
                  {formatCurrency(totalMonthlySpend)}/mo
                </span>{' '}
                could lose an estimated{' '}
                <span className="font-semibold text-accent-rose dark:text-accent-rose-dark font-mono">
                  {formatCurrency(breakdown.purchasingPowerLoss)}
                </span>{' '}
                in annual purchasing power.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
