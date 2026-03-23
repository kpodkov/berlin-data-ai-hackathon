import { useState } from 'react'
import type { Tier1Inputs, EconData } from '../../types'
import { BenchmarkCard } from './BenchmarkCard'
import { formatCurrency, formatPercent } from '../../utils/format'
import { futureValue } from '../../engine/projection'
import { blendedReturn } from '../../engine/allocation'
import { retirementHorizon } from '../../engine/projection'
import { useExplain } from '../../hooks/useCortex'

interface BenchmarkRowProps {
  inputs: Tier1Inputs
  data: EconData
}

type MetricKey = 'wealth' | 'income' | 'savings'

export function BenchmarkRow({ inputs, data }: BenchmarkRowProps) {
  const { age, annualIncome, monthlyInvestment } = inputs
  const { benchmarks, investmentReturns } = data

  const { data: explainData, loading: explaining, explain, reset } = useExplain()
  const [activeMetric, setActiveMetric] = useState<MetricKey | null>(null)

  // Projected wealth at 65 (moderate scenario)
  const horizon = retirementHorizon(age)
  const moderateReturn = blendedReturn('moderate', investmentReturns)
  const nominalReturn = moderateReturn > 0 ? moderateReturn : 0.07
  const projectedWealth = futureValue(0, monthlyInvestment, nominalReturn, horizon)

  // Income vs median
  const medianIncome = benchmarks.housing.medianIncomeAnnual > 0 ? benchmarks.housing.medianIncomeAnnual : 75000
  const incomeRatio = annualIncome / medianIncome
  const incomeVsMedian = incomeRatio - 1  // delta: 0.2 = 20% above

  // Savings rate
  const monthlySavings = monthlyInvestment
  const monthlyIncome = annualIncome / 12
  const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0
  const nationalSavingsRate = benchmarks.savings.savingsRate > 0 ? benchmarks.savings.savingsRate / 100 : 0.035
  const savingsRateDelta = savingsRate - nationalSavingsRate

  function handleExplain(metric: MetricKey, metricName: string, value: number, context: string) {
    if (activeMetric === metric) {
      // toggle off
      setActiveMetric(null)
      reset()
      return
    }
    setActiveMetric(metric)
    reset()
    void explain(metricName, value, context)
  }

  return (
    <div className="flex gap-4">
      <BenchmarkCard
        label="Projected Wealth at 65"
        value={formatCurrency(projectedWealth)}
        sublabel={`${horizon} yrs · moderate growth`}
        onExplain={() =>
          handleExplain(
            'wealth',
            'projected wealth at retirement',
            projectedWealth,
            `${horizon} years of investing €${monthlyInvestment}/month at moderate growth rates`,
          )
        }
        explaining={activeMetric === 'wealth' && explaining}
        explanation={activeMetric === 'wealth' ? (explainData?.explanation ?? null) : null}
      />
      <BenchmarkCard
        label="Income vs Median"
        value={formatCurrency(annualIncome)}
        sublabel={`Median: ${formatCurrency(medianIncome)}`}
        delta={incomeVsMedian}
        deltaLabel="vs median"
        onExplain={() =>
          handleExplain(
            'income',
            'income compared to national median',
            annualIncome,
            `National median household income is €${medianIncome.toLocaleString()}`,
          )
        }
        explaining={activeMetric === 'income' && explaining}
        explanation={activeMetric === 'income' ? (explainData?.explanation ?? null) : null}
      />
      <BenchmarkCard
        label="Savings Rate"
        value={formatPercent(savingsRate)}
        sublabel={`National avg: ${formatPercent(nationalSavingsRate)}`}
        delta={savingsRateDelta}
        deltaLabel="vs national"
        onExplain={() =>
          handleExplain(
            'savings',
            'personal savings rate',
            savingsRate * 100,
            `National average savings rate is ${(nationalSavingsRate * 100).toFixed(1)}%`,
          )
        }
        explaining={activeMetric === 'savings' && explaining}
        explanation={activeMetric === 'savings' ? (explainData?.explanation ?? null) : null}
      />
    </div>
  )
}
