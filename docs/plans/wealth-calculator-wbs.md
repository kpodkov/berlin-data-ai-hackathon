# Wealth Growth Calculator — Work Breakdown Structure

> Hierarchical decomposition of all work. Each leaf is an actionable task.
> Cross-reference: `wealth-calculator-mvp.md` (DAG + tech details), `../design/wealth-calculator-ui-spec.md` (UI spec)

---

## 1. Data Extraction (Snowflake → Static JSON)

### 1.1 FRED Economic Series
- [ ] 1.1.1 Write `extract-fred.sql` — join FRED_OBSERVATIONS to FRED_SERIES_METADATA, all 32 series
- [ ] 1.1.2 Run extraction via `snow sql -c hackathon`, output to `fred_series.json` (keyed by series_id)
- [ ] 1.1.3 Generate `fred_metadata.json` — series_id → title, units, frequency, last_updated
- [ ] 1.1.4 Validate: all 32 series present, no null values in required fields

### 1.2 ETF Market Prices
- [ ] 1.2.1 Write `extract-etf.sql` — join MARKET_PRICES to MARKET_METADATA, all 13 ETFs
- [ ] 1.2.2 Run extraction, output to `etf_prices.json` (monthly close prices keyed by ticker)
- [ ] 1.2.3 Generate `etf_metadata.json` — ticker → name, source
- [ ] 1.2.4 Validate: SPY, QQQ, AGG present with 20+ years of history

### 1.3 Pre-Computed Benchmarks
- [ ] 1.3.1 Write `extract-benchmarks.sql` — latest values for: MEHOINUSA672N, PSAVERT, MSPUS, MORTGAGE30US, TERMCBCCALLNS, TDSP, CPIAUCSL YoY
- [ ] 1.3.2 Compute CAGR for SPY, QQQ, AGG at 1Y, 5Y, 10Y, 20Y lookbacks
- [ ] 1.3.3 Compute YoY inflation rates for all 7 CPI sub-series
- [ ] 1.3.4 Output to `benchmarks.json`
- [ ] 1.3.5 Validate: all values non-null, rates in reasonable ranges

### 1.4 Build Script
- [ ] 1.4.1 Write `build-json.sh` — orchestrates all SQL extractions, writes JSON to `public/data/`
- [ ] 1.4.2 Add `generatedAt` timestamp to each JSON file

---

## 2. Project Scaffolding

### 2.1 Vite + React + TypeScript
- [ ] 2.1.1 Initialize project with `npm create vite@latest wealth-calculator -- --template react-ts`
- [ ] 2.1.2 Install dependencies: recharts, tailwindcss, @tailwindcss/forms
- [ ] 2.1.3 Configure Tailwind with custom color tokens (light + dark mode from UI spec)
- [ ] 2.1.4 Set up dark mode toggle (class-based strategy)
- [ ] 2.1.5 Configure Inter + JetBrains Mono fonts

### 2.2 TypeScript Types
- [ ] 2.2.1 Define `Tier1Inputs`, `Tier2Inputs`, `Tier3Inputs` interfaces
- [ ] 2.2.2 Define `PrecomputedData` interface (matches JSON structure)
- [ ] 2.2.3 Define result types: `ProjectionResult`, `DebtAnalysis`, `InflationBreakdown`, `BenchmarkComparison`
- [ ] 2.2.4 Define `RiskTolerance`, `HousingStatus` union types

### 2.3 Data Layer
- [ ] 2.3.1 Build `loader.ts` — fetch all JSON files on app init, parse, cache in memory
- [ ] 2.3.2 Build `useEconData` hook — typed access to loaded data, handles loading state
- [ ] 2.3.3 Build `series-registry.ts` — maps FRED series IDs to human labels and categories

---

## 3. Calculation Engine (all client-side, zero network)

### 3.1 Projection Engine
- [ ] 3.1.1 `futureValue()` — compound growth with monthly contributions (FV of annuity formula)
- [ ] 3.1.2 `yearByYearProjection()` — returns array of { age, nominal, real, contributions, growth } for charting
- [ ] 3.1.3 `yearsToMilestone()` — iterative solver for "years to $100K/$500K/$1M"
- [ ] 3.1.4 `retirementHorizon()` — years from current age to 65

### 3.2 Allocation Engine
- [ ] 3.2.1 `blendedReturn()` — map risk tolerance → equity/bond split → weighted CAGR from ETF data
- [ ] 3.2.2 Conservative: 60% AGG + 40% SPY; Moderate: 30% AGG + 70% SPY; Aggressive: 10% AGG + 90% QQQ

### 3.3 Benchmark Engine
- [ ] 3.3.1 `incomePercentile()` — user income vs national median (MEHOINUSA672N)
- [ ] 3.3.2 `savingsRateComparison()` — user savings rate vs national (PSAVERT)
- [ ] 3.3.3 `housingBurden()` — monthly housing cost / monthly income, flag if > 30%
- [ ] 3.3.4 `debtToIncome()` — total debt service / monthly income vs national (TDSP)

### 3.4 Debt Engine
- [ ] 3.4.1 `creditCardDrag()` — annual interest cost at national CC rate (TERMCBCCALLNS)
- [ ] 3.4.2 `debtPayoffTimeline()` — months to payoff at minimum payment (iterative)
- [ ] 3.4.3 `netInvestableIncome()` — monthly income minus housing, debt service, investments

### 3.5 Inflation Engine
- [ ] 3.5.1 `personalInflationRate()` — weighted CPI basket from 5 spending categories
- [ ] 3.5.2 `personalVsNational()` — delta between personal rate and CPIAUCSL headline
- [ ] 3.5.3 `purchasingPowerErosion()` — what their spending basket costs in N years
- [ ] 3.5.4 `worstCategory()` — which spending category has highest inflation

### 3.6 Utilities
- [ ] 3.6.1 `formatCurrency()` — $1,234 / $1.2M
- [ ] 3.6.2 `formatPercent()` — 7.2%
- [ ] 3.6.3 `formatCompact()` — 1.2M, 450K

---

## 4. UI Components

### 4.1 Layout Shell
- [ ] 4.1.1 `AppShell` — two-panel layout (380px input / flex results), responsive breakpoint at 1024px
- [ ] 4.1.2 `TopBar` — brand mark, privacy badge, theme toggle
- [ ] 4.1.3 `PrivacyBadge` — always-visible pill with lock icon, click opens modal
- [ ] 4.1.4 `ThemeToggle` — light/dark mode switch, persists via class on `<html>`
- [ ] 4.1.5 `DataSourceFooter` — FRED attribution, disclaimer text

### 4.2 Input Components
- [ ] 4.2.1 `CurrencyInput` — leading `$`, comma formatting on blur, raw number on focus
- [ ] 4.2.2 `NumberInput` — integer input with validation range
- [ ] 4.2.3 `RiskToggle` — segmented control: conservative / moderate / aggressive
- [ ] 4.2.4 `OwnershipToggle` — segmented control: rent / own
- [ ] 4.2.5 `TierCard` — card wrapper with tier number badge, locked/unlocked states
- [ ] 4.2.6 `TierUnlockButton` — "Add more detail →" text link, appears on tier completion

### 4.3 Tier 1 — Quick Start
- [ ] 4.3.1 `Tier1Form` — age, annual income, monthly investment (3 fields)
- [ ] 4.3.2 `Tier1Results` — orchestrates projection chart + benchmark cards
- [ ] 4.3.3 `WealthProjectionChart` — multi-series area chart (conservative/moderate/aggressive)
- [ ] 4.3.4 `BenchmarkCard` — compact stat card with KPI, delta indicator, national comparison
- [ ] 4.3.5 `BenchmarkRow` — horizontal row of 3 benchmark cards (projected wealth, income percentile, savings rate)

### 4.4 Tier 2 — Financial Snapshot
- [ ] 4.4.1 `Tier2Form` — current savings, risk tolerance, rent/own, housing cost, CC debt, other debt (6 fields)
- [ ] 4.4.2 `Tier2Results` — debt analysis panel, housing benchmark, savings rate comparison
- [ ] 4.4.3 `DebtDragBar` — horizontal grouped bar (debt total vs projected savings)
- [ ] 4.4.4 `HousingBenchmarkCard` — housing cost burden vs 30% rule
- [ ] 4.4.5 `SavingsRateComparisonCard` — single bar with national median + recommended ticks
- [ ] 4.4.6 `AllocationPie` — portfolio split visualization based on risk tolerance

### 4.5 Tier 3 — Personal Inflation
- [ ] 4.5.1 `Tier3Form` — food, transport, healthcare, education, energy (5 fields)
- [ ] 4.5.2 `Tier3Results` — personal inflation card, real/nominal toggle, category chart
- [ ] 4.5.3 `PersonalInflationCard` — large comparison: your rate vs national CPI
- [ ] 4.5.4 `RealVsNominalToggle` — switches projection chart between nominal and inflation-adjusted
- [ ] 4.5.5 `CategoryInflationChart` — horizontal bar per category, user vs national

---

## 5. Integration & Orchestration

### 5.1 State Management
- [ ] 5.1.1 `useCalculator` hook — runs all engine functions reactively when inputs change (300ms debounce)
- [ ] 5.1.2 Tier state machine — tracks which tiers are locked/unlocked/complete
- [ ] 5.1.3 Wire tier forms → useCalculator → result components

### 5.2 Progressive Disclosure Wiring
- [ ] 5.2.1 Tier 1 complete → show unlock prompt for Tier 2
- [ ] 5.2.2 Tier 2 complete → show unlock prompt for Tier 3
- [ ] 5.2.3 Unlock animation: card expands, fields stagger in (50ms per field)
- [ ] 5.2.4 Results panel auto-scrolls to new section on unlock

### 5.3 Chart Integration
- [ ] 5.3.1 Connect WealthProjectionChart to projection engine output
- [ ] 5.3.2 Connect DebtDragBar to debt engine output
- [ ] 5.3.3 Connect CategoryInflationChart to inflation engine output
- [ ] 5.3.4 Ensure all charts respect dark/light mode color tokens

### 5.4 Final Polish
- [ ] 5.4.1 Results placeholder state (before T1 data entered)
- [ ] 5.4.2 Privacy modal content
- [ ] 5.4.3 Mobile responsive pass (< 1024px single column)
- [ ] 5.4.4 Input validation error states (field shake, range enforcement)

---

## Summary

| WBS Level 1 | Tasks | Critical? |
|---|---|---|
| 1. Data Extraction | 14 | Yes — blocks everything |
| 2. Project Scaffolding | 11 | Yes — critical path starts here |
| 3. Calculation Engine | 16 | Yes — core logic |
| 4. UI Components | 22 | Yes — user-facing |
| 5. Integration | 11 | Yes — ties it all together |
| **Total** | **74** | |

### Critical Path

```
1.1 (FRED extraction) → 1.3 (benchmarks) ─┐
                                            ├→ 3.1 (projection) → 4.3 (Tier 1 UI) → 5.1 (state) → 5.3 (charts)
2.1 (scaffold) → 2.3 (data layer) ────────┘
```

### Parallel Tracks

```
Track A (data):    1.1 → 1.3 → 1.4
Track B (ETF):     1.2 (parallel with Track A)
Track C (app):     2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 4.3 → 5.1
Track D (T2):      3.3 + 3.4 → 4.4 → 5.2
Track E (T3):      3.5 → 4.5 → 5.2
Track F (layout):  4.1 + 4.2 (parallel with Track C)
```
