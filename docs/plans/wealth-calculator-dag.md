# Wealth Growth Calculator — Executable DAG Plan

> Consolidated from: `wealth-calculator-wbs.md` (74 tasks), `wealth-calculator-mvp.md` (13-task DAG), `../design/wealth-calculator-ui-spec.md` (UI spec)
> Optimized for parallel agent dispatch — 18 tasks across 7 waves.

---

## DAG Overview

```
Wave 1:  t1(FRED)    t2(ETF)    t3(Scaffold)    t4(Types+Registry)
           |                       |                |
Wave 2:  t5(Bench)             t6(DataLayer)───t7(CalcEngine)
           |                       |                |
Wave 3:  t9(Debt+Bench)        t8(Tier1 UI)───────┤    t15(TestPlan)
           |                       |                |
Wave 4:   └──────────────────t10(Tier2 UI)    t11(InflationEngine)
                                   |                |
Wave 5:                         t12(Tier3 UI)──────┘    t15b(Tests)
                                   |
Wave 6:                         t13(Integration)    t16(UIPolish)
                                   |                    |
Wave 7:                         t14(FinalPolish)    t17(Review)    t18(DemoPrep)
```

**Critical path:** t3 → t6 → t8 → t10 → t12 → t13 → t14
**Waves:** 7
**Parallelism:** up to 4 agents busy per wave (~2.8x speedup vs sequential)

---

## Wave 1 — Foundation (4 parallel tasks)

### t1: Extract FRED Data from Snowflake
- **Agent:** `developer`
- **Depends on:** none
- **Critical path:** yes (blocks t5)
- **Files:** `scripts/extract-fred.sql`, `public/data/fred_series.json`, `public/data/fred_metadata.json`
- **Accept:** All 32 series present, keyed by series_id, no null values. Run via `snow sql -c hackathon`.

### t2: Extract ETF Price Data from Snowflake
- **Agent:** `developer`
- **Depends on:** none
- **Files:** `scripts/extract-etf.sql`, `public/data/etf_prices.json`, `public/data/etf_metadata.json`
- **Accept:** SPY, QQQ, AGG present with 20+ years monthly close prices.

### t3: Scaffold Vite + React + TypeScript + Tailwind
- **Agent:** `developer`
- **Depends on:** none
- **Critical path:** YES (binding — starts longest chain)
- **Files:** `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
- **Accept:** `npm run dev` renders blank page, Tailwind configured with all color tokens from UI spec (light+dark), Inter + JetBrains Mono fonts load, dark mode toggle works.

### t4: Define TypeScript Types + Series Registry
- **Agent:** `developer`
- **Depends on:** none
- **Files:** `src/types.ts`, `src/data/series-registry.ts`
- **Accept:** All input/output interfaces defined (Tier1/2/3Inputs, PrecomputedData, ProjectionResult, DebtAnalysis, InflationBreakdown, BenchmarkComparison). Series registry maps all 32 FRED IDs.

---

## Wave 2 — Data Layer + Core Engine (3 parallel tasks)

### t5: Compute Benchmark Data
- **Agent:** `developer`
- **Depends on:** t1, t2
- **Files:** `scripts/extract-benchmarks.sql`, `public/data/benchmarks.json`, `scripts/build-json.sh`
- **Accept:** Latest values for MEHOINUSA672N, PSAVERT, MSPUS, MORTGAGE30US, TERMCBCCALLNS, TDSP. CAGR for SPY/QQQ/AGG at 1Y/5Y/10Y/20Y. YoY rates for 7 CPI sub-series. `build-json.sh` orchestrates all extractions.

### t6: Build Data Loader + useEconData Hook
- **Agent:** `developer`
- **Depends on:** t3, t4
- **Critical path:** YES (binding)
- **Files:** `src/data/loader.ts`, `src/hooks/useEconData.ts`
- **Accept:** Fetches all 5 JSON files on init, caches in memory, typed hook with loading state. Zero network calls after initial load.

### t7: Build Projection + Allocation Engines + Utilities
- **Agent:** `developer`
- **Depends on:** t4
- **Files:** `src/engine/projection.ts`, `src/engine/allocation.ts`, `src/utils/format.ts`
- **Accept:** `futureValue()`, `yearByYearProjection()`, `yearsToMilestone()`, `blendedReturn()`, `formatCurrency()`, `formatPercent()`. All pure functions.

---

## Wave 3 — Tier 1 UI + Supporting Engines (3 parallel tasks)

### t8: Build Tier 1 Form + Results + Charts + Layout Shell
- **Agent:** `developer`
- **Depends on:** t6, t7
- **Critical path:** YES (binding)
- **Files:** `src/components/layout/AppShell.tsx`, `TopBar.tsx`, `PrivacyBadge.tsx`, `ThemeToggle.tsx`, `DataSourceFooter.tsx`, `forms/CurrencyInput.tsx`, `NumberInput.tsx`, `TierCard.tsx`, `TierUnlockButton.tsx`, `Tier1Form.tsx`, `results/Tier1Results.tsx`, `ResultsPlaceholder.tsx`, `charts/WealthProjection.tsx`, `results/BenchmarkCard.tsx`, `BenchmarkRow.tsx`
- **Accept:** Full Tier 1 end-to-end: type 3 inputs → see wealth projection area chart (3 risk levels) + 3 benchmark cards (projected wealth, income percentile, savings rate). Two-panel layout on desktop, single column on mobile. Dark mode works. Privacy badge visible.

### t9: Build Debt + Benchmark Engines
- **Agent:** `developer`
- **Depends on:** t5, t7
- **Files:** `src/engine/debt.ts`, `src/engine/benchmarks.ts`
- **Accept:** `creditCardDrag()`, `debtPayoffTimeline()`, `netInvestableIncome()`, `incomePercentile()`, `savingsRateComparison()`, `housingBurden()`, `debtToIncome()`. All pure.

### t15: Write Test Plan + Core Engine Tests
- **Agent:** `tester`
- **Depends on:** t7
- **Files:** `src/engine/__tests__/projection.test.ts`, `allocation.test.ts`, `tests/test-plan.md`
- **Accept:** Unit tests for projection/allocation/format with known inputs. Test plan covers engine, component, integration, edge cases. `npm test` passes.

---

## Wave 4 — Tier 2 UI + Inflation Engine (2 parallel tasks)

### t10: Build Tier 2 Form + Results + Charts
- **Agent:** `developer`
- **Depends on:** t8, t9
- **Critical path:** YES (binding)
- **Files:** `forms/RiskToggle.tsx`, `OwnershipToggle.tsx`, `Tier2Form.tsx`, `results/Tier2Results.tsx`, `HousingBenchmarkCard.tsx`, `SavingsRateComparisonCard.tsx`, `charts/DebtPayoff.tsx`, `charts/AllocationPie.tsx`
- **Accept:** 6-field form with defaults. RiskToggle keyboard navigable. DebtPayoff horizontal grouped bar. AllocationPie shows equity/bond split. Tier 2 unlocks only after T1 complete. Wealth projection updates with savings + risk allocation.

### t11: Build Personal Inflation Engine
- **Agent:** `developer`
- **Depends on:** t6
- **Files:** `src/engine/inflation.ts`
- **Accept:** `personalInflationRate()` weights 5 CPI sub-series by user spending. `personalVsNational()`, `purchasingPowerErosion()`, `worstCategory()`. All pure.

---

## Wave 5 — Tier 3 UI (2 parallel tasks)

### t12: Build Tier 3 Form + Results + Inflation Chart
- **Agent:** `developer`
- **Depends on:** t10, t11
- **Critical path:** YES (binding)
- **Files:** `forms/Tier3Form.tsx`, `results/Tier3Results.tsx`, `PersonalInflationCard.tsx`, `RealVsNominalToggle.tsx`, `charts/InflationBreakdown.tsx`
- **Accept:** 5 spending inputs. PersonalInflationCard shows user rate vs headline. CategoryInflationChart horizontal bars per category. RealVsNominalToggle splits projection line. Tier 3 completion: "Your full financial picture is ready."

### t15b: Write Debt + Inflation Engine Tests
- **Agent:** `tester`
- **Depends on:** t9, t11
- **Files:** `src/engine/__tests__/debt.test.ts`, `benchmarks.test.ts`, `inflation.test.ts`
- **Accept:** Tests for creditCardDrag, debtPayoff, personalInflationRate, housingBurden. `npm test` passes.

---

## Wave 6 — Integration + UI Polish (2 parallel tasks)

### t13: Wire App.tsx — Tier Progression + useCalculator
- **Agent:** `developer`
- **Depends on:** t12
- **Critical path:** YES (binding)
- **Files:** `src/hooks/useCalculator.ts`, `src/App.tsx` (rewrite)
- **Accept:** `useCalculator` orchestrates all engines with 300ms debounce. Tier state machine: locked→unlocked→complete. Unlock prompts per UI spec. Stagger animation (50ms/field). Results auto-scroll on unlock. All charts connected. Full T1→T2→T3 flow works end-to-end.

### t16: UI Polish — Accessibility + Responsive + Animations
- **Agent:** `designer`
- **Depends on:** t8
- **Files:** multiple component files
- **Accept:** WCAG AA contrast, keyboard navigation on toggles, screen reader tables for charts, focus rings, mobile breakpoints (480/768/1024), chart height capped at 260px on mobile.

---

## Wave 7 — Final (3 parallel tasks)

### t14: Final Polish — States, Privacy, Validation
- **Agent:** `developer`
- **Depends on:** t13
- **Critical path:** YES (last task on critical path)
- **Files:** `ResultsPlaceholder.tsx`, `PrivacyBadge.tsx` (modal content), form validation updates
- **Accept:** Placeholder with blurred chart illustration. Privacy modal text from spec. Input shake on invalid. No localStorage/sessionStorage/cookies. Zero network after load.

### t17: Code Review
- **Agent:** `reviewer`
- **Depends on:** t13
- **Accept:** No secrets, no storage APIs, no post-load network, no `any` types, semantic color tokens only, pure engine functions, component hierarchy matches spec.

### t18: Demo Preparation
- **Agent:** `developer`
- **Depends on:** t14
- **Files:** `wealth-calculator/README.md`
- **Accept:** Setup instructions, architecture overview, `npm run build` clean, production build serves from `dist/`.

---

## Agent Utilization

| Wave | developer | tester | designer | reviewer |
|---|---|---|---|---|
| 1 | 4 (t1,t2,t3,t4) | | | |
| 2 | 3 (t5,t6,t7) | | | |
| 3 | 2 (t8,t9) | 1 (t15) | | |
| 4 | 2 (t10,t11) | | | |
| 5 | 1 (t12) | 1 (t15b) | | |
| 6 | 1 (t13) | | 1 (t16) | |
| 7 | 2 (t14,t18) | | | 1 (t17) |

---

## Risk Register

| Risk | Mitigation |
|---|---|
| Snowflake extraction SQL errors | Test with `LIMIT 10` first, have fallback sample JSON |
| Recharts learning curve | Start basic line chart, iterate to area + tooltips |
| Dark mode color mismatches | CSS variables everywhere, test both modes per component |
| Tier unlock state bugs | Unit test state machine independently before wiring |
| Large JSON slows initial load | Keep JSON minimal (dates+values), lazy-load metadata |
