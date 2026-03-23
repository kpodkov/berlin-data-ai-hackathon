import { useState } from 'react'
import type { Tier1Inputs, Tier2Inputs, EconData } from '../../types'
import { analyzeDebt } from '../../engine/debt'
import { compareToBenchmarks } from '../../engine/benchmarks'
import { blendedReturn, getAllocation } from '../../engine/allocation'
import { retirementHorizon } from '../../engine/projection'
import { DebtPayoff } from '../charts/DebtPayoff'
import { AllocationPie } from '../charts/AllocationPie'
import { HousingBenchmarkCard } from './HousingBenchmarkCard'
import { SavingsRateComparisonCard } from './SavingsRateComparisonCard'
import { BenchmarkCard } from './BenchmarkCard'
import { formatCurrency } from '../../utils/format'
import { useExplain } from '../../hooks/useCortex'

interface Tier2ResultsProps {
  tier1: Tier1Inputs
  tier2: Tier2Inputs
  data: EconData
}

type DebtMetricKey = 'ccInterest' | 'dti' | 'ccPayoff'

export function Tier2Results({ tier1, tier2, data }: Tier2ResultsProps) {
  const { benchmarks, investmentReturns } = data
  const monthlyIncome = tier1.annualIncome / 12

  const { data: explainData, loading: explaining, explain, reset } = useExplain()
  const [activeMetric, setActiveMetric] = useState<DebtMetricKey | null>(null)

  function handleExplain(metric: DebtMetricKey, metricName: string, value: number, context: string) {
    if (activeMetric === metric) {
      setActiveMetric(null)
      reset()
      return
    }
    setActiveMetric(metric)
    reset()
    void explain(metricName, value, context)
  }

  // Debt analysis using live CC rate from benchmarks
  const ccRate = benchmarks.debt.creditCardRate > 0 ? benchmarks.debt.creditCardRate : 21.5
  const debtAnalysis = analyzeDebt(
    tier2.creditCardDebt,
    tier2.otherDebt,
    ccRate,
    monthlyIncome,
    tier2.monthlyHousingCost,
    tier1.monthlyInvestment,
  )

  // Benchmark comparison
  const comparison = compareToBenchmarks(
    tier1.annualIncome,
    tier1.monthlyInvestment,
    tier2.monthlyHousingCost,
    tier2.creditCardDebt,
    tier2.otherDebt,
    benchmarks,
  )

  // Return for selected risk tolerance
  const riskReturn = blendedReturn(tier2.riskTolerance, investmentReturns) || 0.07
  const horizon = retirementHorizon(tier1.age)
  const allocation = getAllocation(tier2.riskTolerance)

  const nationalSavingsRate = benchmarks.savings.savingsRate > 0
    ? benchmarks.savings.savingsRate / 100
    : 0.035

  const hasDebt = tier2.creditCardDebt > 0 || tier2.otherDebt > 0

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="
        bg-surface dark:bg-surface-dark
        border border-border dark:border-border-dark
        rounded-xl p-5 shadow-sm
      ">
        <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-1">
          Financial Snapshot
        </h2>
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
          Debt impact, housing burden, and savings benchmarks.
        </p>

        {/* Net investable income highlight */}
        <div className="mt-4 pt-4 border-t border-border dark:border-border-dark">
          <p className="text-xs text-text-muted dark:text-text-muted-dark mb-0.5">
            Monthly Cash Flow After Housing + Debt + Investments
          </p>
          <p className={`text-xl font-bold font-mono ${
            debtAnalysis.netInvestableIncome >= 0
              ? 'text-accent-emerald dark:text-accent-emerald-dark'
              : 'text-accent-rose dark:text-accent-rose-dark'
          }`}>
            {debtAnalysis.netInvestableIncome >= 0 ? '+' : ''}
            {formatCurrency(debtAnalysis.netInvestableIncome)}
            <span className="text-sm font-normal text-text-muted dark:text-text-muted-dark ml-1">/mo</span>
          </p>
          {debtAnalysis.netInvestableIncome < 0 && (
            <p className="text-xs text-accent-rose dark:text-accent-rose-dark mt-0.5">
              Cash-flow gap — consider reducing debt or housing costs
            </p>
          )}
        </div>
      </div>

      {/* Housing + Savings row */}
      <div className="flex gap-4">
        <HousingBenchmarkCard
          housingBurdenPct={comparison.housingBurdenPct}
          monthlyHousingCost={tier2.monthlyHousingCost}
          monthlyIncome={monthlyIncome}
        />
        <SavingsRateComparisonCard
          monthlyInvestment={tier1.monthlyInvestment}
          annualIncome={tier1.annualIncome}
          nationalSavingsRate={nationalSavingsRate}
        />
      </div>

      {/* Debt section */}
      {hasDebt && (
        <div className="space-y-4">
          <DebtPayoff
            creditCardDebt={tier2.creditCardDebt}
            otherDebt={tier2.otherDebt}
            monthlyDebtService={debtAnalysis.totalDebtServiceMonthly}
            yearsHorizon={Math.min(horizon, 20)}
            annualReturn={riskReturn}
          />

          {/* Debt stats row */}
          <div className="flex gap-4">
            {tier2.creditCardDebt > 0 && (
              <BenchmarkCard
                label="CC Interest / Year"
                value={formatCurrency(debtAnalysis.creditCardAnnualInterest)}
                sublabel={`At ${ccRate.toFixed(1)}% APR`}
                delta={-(debtAnalysis.creditCardAnnualInterest / Math.max(1, tier1.annualIncome))}
                deltaLabel="of income"
                onExplain={() =>
                  handleExplain(
                    'ccInterest',
                    'credit card interest cost per year',
                    debtAnalysis.creditCardAnnualInterest,
                    `€${tier2.creditCardDebt.toLocaleString()} balance at ${ccRate.toFixed(1)}% APR`,
                  )
                }
                explaining={activeMetric === 'ccInterest' && explaining}
                explanation={activeMetric === 'ccInterest' ? (explainData?.explanation ?? null) : null}
              />
            )}
            <BenchmarkCard
              label="Debt-to-Income"
              value={`${debtAnalysis.debtToIncomeRatio.toFixed(1)}%`}
              sublabel={`National: ${benchmarks.debt.debtServiceRatio.toFixed(1)}%`}
              delta={-(comparison.dtiVsNational / 100)}
              deltaLabel="vs national"
              onExplain={() =>
                handleExplain(
                  'dti',
                  'debt-to-income ratio',
                  debtAnalysis.debtToIncomeRatio,
                  `National average debt service ratio is ${benchmarks.debt.debtServiceRatio.toFixed(1)}%`,
                )
              }
              explaining={activeMetric === 'dti' && explaining}
              explanation={activeMetric === 'dti' ? (explainData?.explanation ?? null) : null}
            />
            {tier2.creditCardDebt > 0 && (
              <BenchmarkCard
                label="CC Payoff"
                value={
                  debtAnalysis.creditCardPayoffMonths >= 600
                    ? '50+ yrs'
                    : debtAnalysis.creditCardPayoffMonths > 24
                      ? `${Math.round(debtAnalysis.creditCardPayoffMonths / 12)} yrs`
                      : `${debtAnalysis.creditCardPayoffMonths} mo`
                }
                sublabel="At minimum payments"
                onExplain={() =>
                  handleExplain(
                    'ccPayoff',
                    'credit card payoff timeline',
                    debtAnalysis.creditCardPayoffMonths,
                    `€${tier2.creditCardDebt.toLocaleString()} balance, minimum payments only, at ${ccRate.toFixed(1)}% APR`,
                  )
                }
                explaining={activeMetric === 'ccPayoff' && explaining}
                explanation={activeMetric === 'ccPayoff' ? (explainData?.explanation ?? null) : null}
              />
            )}
          </div>
        </div>
      )}

      {!hasDebt && (
        <div className="
          bg-accent-emerald/5 dark:bg-accent-emerald/10
          border border-accent-emerald/20 dark:border-accent-emerald/20
          rounded-xl p-4
        ">
          <p className="text-sm font-medium text-accent-emerald dark:text-accent-emerald-dark">
            No high-interest debt
          </p>
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
            You're in a strong position to invest the{' '}
            <span className="font-mono font-semibold">
              {allocation.equityWeight * 100}% {allocation.equityTicker} / {allocation.bondWeight * 100}% {allocation.bondTicker}
            </span>{' '}
            portfolio below.
          </p>
        </div>
      )}

      {/* Allocation pie */}
      <AllocationPie riskTolerance={tier2.riskTolerance} />
    </div>
  )
}
