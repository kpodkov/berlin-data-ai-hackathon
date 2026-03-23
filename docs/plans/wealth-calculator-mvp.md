# Wealth Growth Calculator MVP — Implementation Plan

> **Goal:** Static-first web app that pre-fetches FRED + ETF data from Snowflake at build time, runs all personal finance projections client-side. User data never leaves the browser.

**Tech Stack:** Vite + React + TypeScript, Recharts, Tailwind CSS
**Data:** `DB_TEAM_3.RAW` via `snow sql -c hackathon`

---

## File Structure

```
wealth-calculator/
  public/
    data/
      fred_series.json        # Pre-fetched FRED observations (keyed by series_id)
      fred_metadata.json      # Series metadata (titles, units, frequencies)
      etf_prices.json         # Monthly ETF close prices (keyed by ticker)
      etf_metadata.json       # ETF metadata
      benchmarks.json         # Pre-computed national medians/rates
  src/
    main.tsx
    App.tsx                   # Tier state management, layout
    types.ts                  # All TypeScript interfaces
    data/
      loader.ts               # Fetch + cache JSON on init
      series-registry.ts      # FRED ID -> human label mapping
    engine/
      projection.ts           # Compound growth with contributions
      inflation.ts            # Personal CPI calculator (Tier 3)
      benchmarks.ts           # User vs national comparisons
      debt.ts                 # Payoff timeline, interest drag
      allocation.ts           # Risk tolerance -> blended return
    components/
      layout/
        Header.tsx
        ProgressBar.tsx
      forms/
        Tier1Form.tsx
        Tier2Form.tsx
        Tier3Form.tsx
      charts/
        WealthProjection.tsx   # Area chart: wealth over time
        InflationBreakdown.tsx # Bar chart: personal vs national CPI
        DebtPayoff.tsx         # Debt reduction timeline
        AllocationPie.tsx      # Portfolio allocation
      results/
        Tier1Results.tsx
        Tier2Results.tsx
        Tier3Results.tsx
    hooks/
      useCalculator.ts        # Orchestrates engine calls on input change
      useEconData.ts          # Typed access to pre-loaded JSON
    utils/
      format.ts               # Currency, percentage, compact numbers
  scripts/
    extract-fred.sql
    extract-etf.sql
    extract-benchmarks.sql
    build-json.sh             # Orchestrator: runs SQL, writes JSON
  index.html
  vite.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
```

---

## DAG

### Wave 1 (parallel — no dependencies)

```yaml
- id: t1
  title: "Extract FRED data from Snowflake to JSON"
  agent: developer
  depends_on: []
  output: ["scripts/extract-fred.sql", "public/data/fred_series.json", "public/data/fred_metadata.json"]
  critical_path: true
  notes: >
    Query DB_TEAM_3.RAW.FRED_OBSERVATIONS joined to FRED_SERIES_METADATA.
    Output: { "CPIAUCSL": [{ "date": "2024-01-01", "value": 312.23 }, ...], ... }

- id: t2
  title: "Extract ETF price data from Snowflake to JSON"
  agent: developer
  depends_on: []
  output: ["scripts/extract-etf.sql", "public/data/etf_prices.json", "public/data/etf_metadata.json"]
  critical_path: true

- id: t3
  title: "Scaffold Vite + React + TypeScript + Tailwind + Recharts"
  agent: developer
  depends_on: []
  output: ["package.json", "vite.config.ts", "tailwind.config.ts", "index.html", "src/main.tsx", "src/App.tsx"]
  critical_path: true

- id: t4
  title: "Define TypeScript types and series registry"
  agent: developer
  depends_on: []
  output: ["src/types.ts", "src/data/series-registry.ts"]
```

### Wave 2

```yaml
- id: t5
  title: "Compute benchmark data (national medians/rates)"
  agent: developer
  depends_on: [t1]
  output: ["scripts/extract-benchmarks.sql", "public/data/benchmarks.json"]

- id: t6
  title: "Build data loader + useEconData hook"
  agent: developer
  depends_on: [t3, t4]
  output: ["src/data/loader.ts", "src/hooks/useEconData.ts"]
  critical_path: true

- id: t7
  title: "Build calculation engine (projection + allocation)"
  agent: developer
  depends_on: [t4]
  output: ["src/engine/projection.ts", "src/engine/allocation.ts", "src/utils/format.ts"]
  critical_path: true
```

### Wave 3

```yaml
- id: t8
  title: "Build Tier 1 form + results + wealth projection chart"
  agent: developer
  depends_on: [t6, t7]
  output: ["src/components/forms/Tier1Form.tsx", "src/components/results/Tier1Results.tsx", "src/components/charts/WealthProjection.tsx"]
  critical_path: true

- id: t9
  title: "Build debt + benchmark engines"
  agent: developer
  depends_on: [t5, t7]
  output: ["src/engine/debt.ts", "src/engine/benchmarks.ts"]
```

### Wave 4

```yaml
- id: t10
  title: "Build Tier 2 form + results + debt/allocation charts"
  agent: developer
  depends_on: [t8, t9]
  output: ["src/components/forms/Tier2Form.tsx", "src/components/results/Tier2Results.tsx", "src/components/charts/DebtPayoff.tsx", "src/components/charts/AllocationPie.tsx"]

- id: t11
  title: "Build personal inflation engine"
  agent: developer
  depends_on: [t6]
  output: ["src/engine/inflation.ts"]
```

### Wave 5

```yaml
- id: t12
  title: "Build Tier 3 form + results + inflation chart"
  agent: developer
  depends_on: [t10, t11]
  output: ["src/components/forms/Tier3Form.tsx", "src/components/results/Tier3Results.tsx", "src/components/charts/InflationBreakdown.tsx"]
```

### Wave 6 (integration)

```yaml
- id: t13
  title: "Wire App.tsx: tier progression, useCalculator, layout"
  agent: developer
  depends_on: [t8, t10, t12]
  output: ["src/App.tsx", "src/hooks/useCalculator.ts", "src/components/layout/Header.tsx", "src/components/layout/ProgressBar.tsx"]
  critical_path: true
```

### DAG Visualization

```
Wave 1:  t1(FRED)   t2(ETF)   t3(Scaffold)   t4(Types)
           |                      |               |
Wave 2:  t5(Bench)            t6(Loader)------+ t7(Engine)
           |                      |                |
Wave 3:   t9(Debt+Bench)      t8(Tier1)----------+
           |                      |
Wave 4:   |                   t10(Tier2)------+ t11(Inflation)
           |                      |                |
Wave 5:                       t12(Tier3)----------+
                                  |
Wave 6:                       t13(Integration)
```

**Critical path:** t3 → t6 → t8 → t13

---

## Progressive Disclosure Tiers

### Tier 1 — Quick Start (3 fields)

| Field | Type | Validation |
|---|---|---|
| Age | integer | 18–80 |
| Annual income | USD | > 0, <= 10M |
| Monthly investment | USD | >= 0, <= income/12 |

**Calculations:** Wealth projection (3 risk levels), income vs national median, savings rate vs PSAVERT, years to $100K

### Tier 2 — Financial Snapshot (+6 fields)

| Field | Type | Default |
|---|---|---|
| Current savings | USD | $0 |
| Risk tolerance | conservative/moderate/aggressive | moderate |
| Rent or own | toggle | rent |
| Monthly housing cost | USD | 30% of income/12 |
| Credit card debt | USD | $0 |
| Other debt | USD | $0 |

**Unlocks:** Debt drag (CC rate from TERMCBCCALLNS), housing burden vs 30% rule, DTI vs national (TDSP), refined projection with actual starting savings + risk allocation

### Tier 3 — Personal Inflation (+5 fields)

| Field | Type | Default |
|---|---|---|
| Monthly food | USD | national avg |
| Monthly transport | USD | national avg |
| Monthly healthcare | USD | national avg |
| Monthly education | USD | $0 |
| Monthly energy | USD | national avg |

**Unlocks:** Personal inflation rate (weighted CPI basket), personal vs national CPI delta, real returns adjusted by personal inflation, purchasing power erosion, worst-category alert

---

## Key Calculations

### C7 — Future Value with Monthly Contributions
```
FV = principal × (1 + r)^n + monthly × ((1 + r_m)^(n×12) - 1) / r_m
where r_m = (1 + r)^(1/12) - 1
```

### C8 — Risk-Adjusted Return
```
conservative: 0.6 × AGG_CAGR + 0.4 × SPY_CAGR
moderate:     0.3 × AGG_CAGR + 0.7 × SPY_CAGR
aggressive:   0.1 × AGG_CAGR + 0.9 × QQQ_CAGR
```

### C17 — Personal Inflation Rate
```
personalCPI = w_food × CPIUFDSL_yoy + w_transport × CUUR0000SAT1_yoy
            + w_health × CPIMEDSL_yoy + w_edu × CUSR0000SAE1_yoy
            + w_energy × CPIENGSL_yoy
where weights = user spend / total spend
```

---

## Privacy Constraint

- User inputs stored in React state only — never persisted, never transmitted
- No localStorage, no sessionStorage, no cookies
- All economic data pre-fetched as static JSON at build time
- Zero network calls after initial page load
- Privacy badge always visible in header

---

## Data Flow

```
Snowflake (build time) → static JSON files → browser loads once → user types →
client-side engine computes → charts render → NO data leaves browser
```
