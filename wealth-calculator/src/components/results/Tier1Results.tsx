import type { Tier1Inputs, ProjectionResult, EconData } from '../../types'
import { WealthProjection } from '../charts/WealthProjection'
import { BenchmarkRow } from './BenchmarkRow'
import { yearByYearProjection, retirementHorizon } from '../../engine/projection'
import { blendedReturn } from '../../engine/allocation'

interface Tier1ResultsProps {
  inputs: Tier1Inputs
  data: EconData
  hideChart?: boolean
}

// Fallback rates when ETF data is absent
const FALLBACK_RATES: Record<string, number> = {
  conservative: 0.05,
  moderate:     0.07,
  aggressive:   0.10,
}

function buildProjection(inputs: Tier1Inputs, data: EconData): ProjectionResult {
  const { age, monthlyInvestment } = inputs
  const { benchmarks, investmentReturns } = data

  const inflationRate = benchmarks.inflation.cpiAllYoy > 0
    ? benchmarks.inflation.cpiAllYoy / 100
    : 0.03

  const conservativeReturn = blendedReturn('conservative', investmentReturns) || FALLBACK_RATES.conservative
  const moderateReturn     = blendedReturn('moderate',     investmentReturns) || FALLBACK_RATES.moderate
  const aggressiveReturn   = blendedReturn('aggressive',   investmentReturns) || FALLBACK_RATES.aggressive

  const targetAge = Math.max(70, age + 5)

  const conservative = yearByYearProjection(age, 0, monthlyInvestment, conservativeReturn, inflationRate, targetAge)
  const moderate     = yearByYearProjection(age, 0, monthlyInvestment, moderateReturn,     inflationRate, targetAge)
  const aggressive   = yearByYearProjection(age, 0, monthlyInvestment, aggressiveReturn,   inflationRate, targetAge)

  const horizon = retirementHorizon(age)
  const yearsTo100k = null  // T1 doesn't compute this yet

  return {
    conservative,
    moderate,
    aggressive,
    yearsToRetire: horizon,
    yearsTo100k,
  }
}

export function Tier1Results({ inputs, data, hideChart = false }: Tier1ResultsProps) {
  const projection = buildProjection(inputs, data)

  return (
    <div className="space-y-6">
      {/* Chart card — hidden when App.tsx renders its own risk-adjusted chart */}
      {!hideChart && (
        <div className="
          bg-surface dark:bg-surface-dark
          border border-border dark:border-border-dark
          rounded-xl p-5 shadow-sm
        ">
          <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-5">
            Wealth Trajectory
          </h2>
          <WealthProjection projection={projection} currentAge={inputs.age} />
        </div>
      )}

      {/* Benchmark cards */}
      <BenchmarkRow inputs={inputs} data={data} />
    </div>
  )
}
