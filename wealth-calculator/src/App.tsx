import { useState, useEffect, useCallback, useRef } from 'react'
import type { Tier1Inputs, Tier2Inputs, Tier3Inputs, EconData } from './types'
import { TIER2_DEFAULTS, TIER3_DEFAULTS } from './types'
import { useEconData } from './hooks/useEconData'
import { blendedReturn } from './engine/allocation'

import { TopBar } from './components/layout/TopBar'
import { AppShell } from './components/layout/AppShell'
import { TierCard } from './components/forms/TierCard'
import { TierUnlockButton } from './components/forms/TierUnlockButton'
import { Tier1Form } from './components/forms/Tier1Form'
import { Tier2Form } from './components/forms/Tier2Form'
import { Tier1Results } from './components/results/Tier1Results'
import { Tier2Results } from './components/results/Tier2Results'
import { Tier3Results } from './components/results/Tier3Results'
import { Tier3Form } from './components/forms/Tier3Form'
import { ResultsPlaceholder } from './components/results/ResultsPlaceholder'
import { DataSourceFooter } from './components/layout/DataSourceFooter'
import { AskCortexButton } from './components/layout/AskCortexButton'
import { EconomicBriefing } from './components/results/EconomicBriefing'
import { EducationQA } from './components/results/EducationQA'
import { ConsumerInsights } from './components/results/ConsumerInsights'
import { WealthProjection } from './components/charts/WealthProjection'
import { yearByYearProjection, retirementHorizon } from './engine/projection'
import type { ProjectionResult } from './types'

const EMPTY_TIER1: Tier1Inputs = {
  age: 0,
  annualIncome: 0,
  monthlyInvestment: 0,
}

const FALLBACK_RATES: Record<string, number> = {
  conservative: 0.05,
  moderate:     0.07,
  aggressive:   0.10,
}

function isTier1Complete(inputs: Tier1Inputs): boolean {
  return (
    inputs.age >= 18 &&
    inputs.age <= 80 &&
    inputs.annualIncome > 0 &&
    inputs.monthlyInvestment >= 0
  )
}

function isTier2Complete(inputs: Tier2Inputs): boolean {
  return inputs.currentSavings > 0 || inputs.monthlyHousingCost > 0
}

// Spinner for data loading state
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="
        w-8 h-8 rounded-full border-2
        border-border dark:border-border-dark
        border-t-accent-blue dark:border-t-accent-blue-dark
        animate-spin
      " />
      <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
        Loading economic data...
      </p>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="
      flex flex-col items-center justify-center min-h-[400px] gap-3
      text-center p-8
    ">
      <p className="text-sm font-semibold text-accent-rose dark:text-accent-rose-dark">
        Failed to load data
      </p>
      <p className="text-xs text-text-secondary dark:text-text-secondary-dark max-w-xs">
        {message}. Projections will use fallback rates.
      </p>
    </div>
  )
}

export default function App() {
  // Dark mode
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const toggleDark = useCallback(() => setDark((d) => !d), [])

  // Economic data
  const { data, loading, error } = useEconData()

  // Tier 1 inputs — with 300ms debounce for chart recalculation
  const [draftInputs, setDraftInputs] = useState<Tier1Inputs>(EMPTY_TIER1)
  const [liveInputs, setLiveInputs] = useState<Tier1Inputs>(EMPTY_TIER1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTier1Change = useCallback((values: Tier1Inputs) => {
    setDraftInputs(values)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLiveInputs(values)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const tier1Complete = isTier1Complete(liveInputs)

  // Tier 2 state
  const [tier2Unlocked, setTier2Unlocked] = useState(false)
  const [tier2Inputs, setTier2Inputs] = useState<Tier2Inputs>(TIER2_DEFAULTS)
  const [liveTier2Inputs, setLiveTier2Inputs] = useState<Tier2Inputs>(TIER2_DEFAULTS)
  const tier2DebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTier2Change = useCallback((values: Tier2Inputs) => {
    setTier2Inputs(values)
    if (tier2DebounceRef.current) clearTimeout(tier2DebounceRef.current)
    tier2DebounceRef.current = setTimeout(() => {
      setLiveTier2Inputs(values)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (tier2DebounceRef.current) clearTimeout(tier2DebounceRef.current)
    }
  }, [])

  const tier2Complete = tier2Unlocked && isTier2Complete(liveTier2Inputs)

  // Tier 3 state
  const [tier3Unlocked, setTier3Unlocked] = useState(false)
  const [tier3Inputs, setTier3Inputs] = useState<Tier3Inputs>(TIER3_DEFAULTS)

  function isTier3Complete(inputs: Tier3Inputs): boolean {
    return inputs.monthlyFood + inputs.monthlyTransport + inputs.monthlyHealthcare + inputs.monthlyEducation + inputs.monthlyEnergy > 0
  }

  const tier3Complete = tier3Unlocked && isTier3Complete(tier3Inputs)

  // When Tier 2 is unlocked, build a risk-adjusted projection for the chart
  // (single line showing the user's chosen risk tolerance)
  const riskAdjustedProjection: ProjectionResult | null = (() => {
    if (!tier2Unlocked || !data) return null
    const { age, monthlyInvestment } = liveInputs
    const { benchmarks, investmentReturns } = data
    const inflationRate = benchmarks.inflation.cpiAllYoy > 0
      ? benchmarks.inflation.cpiAllYoy / 100
      : 0.03
    const risk = liveTier2Inputs.riskTolerance
    const annualReturn = blendedReturn(risk, investmentReturns) || FALLBACK_RATES[risk]
    const targetAge = Math.max(70, age + 5)
    const singleLine = yearByYearProjection(age, liveTier2Inputs.currentSavings, monthlyInvestment, annualReturn, inflationRate, targetAge)
    const horizon = retirementHorizon(age)
    return {
      conservative: risk === 'conservative' ? singleLine : [],
      moderate:     risk === 'moderate'     ? singleLine : [],
      aggressive:   risk === 'aggressive'   ? singleLine : [],
      yearsToRetire: horizon,
      yearsTo100k: null,
    }
  })()

  // Tier 2 tier state for TierCard
  const tier2CardState = !tier2Unlocked
    ? 'locked' as const
    : tier2Complete
      ? 'complete' as const
      : 'unlocked' as const

  // Input panel content
  const inputPanel = (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
          Your Profile
        </h2>
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
          Start with 3 numbers to see your wealth trajectory.
        </p>
      </div>

      <TierCard
        tier={1}
        title="Quick Start"
        description="Three inputs to project your wealth trajectory."
        state={tier1Complete ? 'complete' : 'unlocked'}
      >
        <Tier1Form values={draftInputs} onChange={handleTier1Change} />
      </TierCard>

      <TierCard
        tier={2}
        title="Financial Snapshot"
        description="Savings, debts, and risk tolerance for a more accurate picture."
        state={tier2CardState}
      >
        <Tier2Form value={tier2Inputs} onChange={handleTier2Change} />
      </TierCard>

      <TierCard
        tier={3}
        title="Personal Inflation"
        description="Your actual spending categories to calculate your real inflation rate."
        state={!tier3Unlocked ? 'locked' : tier3Complete ? 'complete' : 'unlocked'}
      >
        {tier3Unlocked && <Tier3Form value={tier3Inputs} onChange={setTier3Inputs} />}
      </TierCard>

      {tier1Complete && !tier2Unlocked && (
        <TierUnlockButton
          onClick={() => setTier2Unlocked(true)}
          label="Your projection is ready. Want a more accurate picture?"
        />
      )}

      {tier2Complete && !tier3Unlocked && (
        <TierUnlockButton
          onClick={() => setTier3Unlocked(true)}
          label="Debt and housing added. Unlock your personal inflation rate"
        />
      )}

      {tier3Complete && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-emerald/10 dark:bg-accent-emerald-dark/10">
          <span className="text-accent-emerald dark:text-accent-emerald-dark">✓</span>
          <span className="text-xs text-text-secondary dark:text-text-secondary-dark">Your full financial picture is ready.</span>
        </div>
      )}

      <DataSourceFooter />
    </div>
  )

  // Results panel content
  let resultsContent: React.ReactNode

  if (loading) {
    resultsContent = <LoadingSpinner />
  } else if (error && !data) {
    resultsContent = <ErrorMessage message={error} />
  } else if (!tier1Complete || !data) {
    resultsContent = <ResultsPlaceholder />
  } else {
    // Tier 1 wealth trajectory — use risk-adjusted single line when Tier 2 is unlocked
    const projectionToShow = riskAdjustedProjection ?? buildTier1Projection(liveInputs, data)

    resultsContent = (
      <div className="space-y-8">
        {/* Economic Briefing — AI summary */}
        <EconomicBriefing />

        {/* ═══════ MARKET DATA ═══════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-5 rounded-full bg-accent-blue dark:bg-accent-blue-dark" />
            <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
              Market Data
            </h2>
            <div className="flex-1 h-px bg-border dark:bg-border-dark" />
          </div>

          <div className="space-y-6">
            {/* Wealth Trajectory chart */}
            <div className="
              bg-surface dark:bg-surface-dark
              border border-border dark:border-border-dark
              rounded-xl p-5 shadow-sm
            ">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-text-primary dark:text-text-primary-dark">
                  Wealth Trajectory
                </h3>
                {tier2Unlocked && (
                  <span className="text-xs text-text-secondary dark:text-text-secondary-dark">
                    {liveTier2Inputs.riskTolerance} · risk-adjusted
                  </span>
                )}
              </div>
              <WealthProjection projection={projectionToShow} currentAge={liveInputs.age} />
            </div>

            {/* Income & savings benchmarks */}
            <Tier1Results inputs={liveInputs} data={data} hideChart />

            {/* Portfolio allocation (Tier 2) */}
            {tier2Unlocked && (
              <Tier2Results tier1={liveInputs} tier2={liveTier2Inputs} data={data} />
            )}
          </div>
        </section>

        {/* ═══════ CONSUMER INTELLIGENCE ═══════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-5 rounded-full bg-accent-amber dark:bg-accent-amber-dark" />
            <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
              Consumer Intelligence
            </h2>
            <div className="flex-1 h-px bg-border dark:bg-border-dark" />
          </div>
          <ConsumerInsights income={liveInputs.annualIncome} />
        </section>

        {/* ═══════ YOUR FINANCES ═══════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-5 rounded-full bg-accent-emerald dark:bg-accent-emerald-dark" />
            <h2 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
              Your Finances
            </h2>
            <div className="flex-1 h-px bg-border dark:bg-border-dark" />
          </div>

          <div className="space-y-6">
            {/* Personal inflation (Tier 3) */}
            {tier3Unlocked && (
              <Tier3Results tier1={liveInputs} tier3={tier3Inputs} benchmarks={data.benchmarks} />
            )}

            {/* Education Q&A */}
            <EducationQA />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-background-dark transition-colors duration-200">
      <TopBar
        dark={dark}
        onToggleDark={toggleDark}
        cortexButton={
          <AskCortexButton
            tier1={tier1Complete ? liveInputs : null}
            tier2={tier2Complete ? liveTier2Inputs : null}
            enabled={tier1Complete}
          />
        }
      />
      <AppShell inputPanel={inputPanel} resultsPanel={resultsContent} />
    </div>
  )
}

// Build a standard 3-scenario projection for Tier 1 display
function buildTier1Projection(
  inputs: Tier1Inputs,
  data: EconData,
): ProjectionResult {
  const { age, monthlyInvestment } = inputs
  const { benchmarks, investmentReturns } = data

  const inflationRate = benchmarks.inflation.cpiAllYoy > 0
    ? benchmarks.inflation.cpiAllYoy / 100
    : 0.03

  const conservativeReturn = blendedReturn('conservative', investmentReturns) || FALLBACK_RATES.conservative
  const moderateReturn     = blendedReturn('moderate',     investmentReturns) || FALLBACK_RATES.moderate
  const aggressiveReturn   = blendedReturn('aggressive',   investmentReturns) || FALLBACK_RATES.aggressive

  const targetAge = Math.max(70, age + 5)
  const horizon = retirementHorizon(age)

  return {
    conservative: yearByYearProjection(age, 0, monthlyInvestment, conservativeReturn, inflationRate, targetAge),
    moderate:     yearByYearProjection(age, 0, monthlyInvestment, moderateReturn,     inflationRate, targetAge),
    aggressive:   yearByYearProjection(age, 0, monthlyInvestment, aggressiveReturn,   inflationRate, targetAge),
    yearsToRetire: horizon,
    yearsTo100k: null,
  }
}
