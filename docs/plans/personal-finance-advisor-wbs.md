# Personal Finance Advisor — Work Breakdown Structure

> Hackathon implementation plan for a Lightdash + Cortex AI personal finance advisor.
> All work runs in Snowflake (DB_TEAM_3). No local compute except ingestion scripts.
> Date: 2026-03-23

---

## Status Key

- [ ] Not started
- [x] Complete

---

## Phase 0: Data Foundation (COMPLETE)

> RAW layer is loaded and documented. No work needed.

- [x] **0.1** Ingest FRED data (31 series, 48.5K rows)
- [x] **0.2** Ingest Yahoo Finance market data (13 tickers, 71.6K rows)
- [x] **0.3** Ingest World Bank indicators (147 series, 3.4K rows)
- [x] **0.4** Add table and column comments to all RAW tables

---

## Phase 1: Staging Layer

> `DB_TEAM_3.STAGING` — clean, normalize, enrich raw data.
> Pure SQL views (no materialization needed at this scale).

### 1.1 FRED Staging View
- [ ] **1.1.1** Create schema `STAGING`
- [ ] **1.1.2** Create `stg_fred_timeseries` view
  - Join `RAW.FRED_OBSERVATIONS` to `RAW.FRED_SERIES_METADATA`
  - Add `category` column: map each series_id to one of (income, savings, debt, housing, cpi, rates, market, wealth)
  - Cast `obs_date` to DATE, `value` to NUMBER
  - Add `title`, `units`, `frequency` from metadata
- [ ] **1.1.3** Verify: `SELECT category, COUNT(DISTINCT series_id), COUNT(*) FROM staging.stg_fred_timeseries GROUP BY 1`

### 1.2 Market Staging View
- [ ] **1.2.1** Create `stg_market_returns` view
  - Join `RAW.MARKET_PRICES` to `RAW.MARKET_METADATA`
  - Add `asset_class` column: equity (SPY/QQQ/VEA/VWO), bond (AGG/TLT/TIP), commodity (GLD/XLE), crypto (BTC-USD/ETH-USD), currency (DX-Y.NYB)
  - Compute `daily_return`: `(value / LAG(value) OVER (PARTITION BY series_id ORDER BY obs_date)) - 1`
  - Compute `monthly_close`: last close per series per month (for mart joins)
- [ ] **1.2.2** Verify: `SELECT asset_class, COUNT(DISTINCT series_id) FROM staging.stg_market_returns GROUP BY 1`

### 1.3 World Bank Staging View
- [ ] **1.3.1** Create `stg_worldbank_countries` view
  - Split `series_id` into `indicator_code` and `country_code` (split on last `_`)
  - Join to `RAW.WORLDBANK_METADATA` for `title`
  - Add `indicator_name` (short label: 'GDP per Capita', 'Inflation', etc.)
  - Extract `year` from `obs_date`
- [ ] **1.3.2** Verify: `SELECT indicator_name, COUNT(DISTINCT country_code) FROM staging.stg_worldbank_countries GROUP BY 1`

**Phase 1 deliverable:** 3 staging views, all queryable, category/class labels correct.

---

## Phase 2: Mart Tables

> `DB_TEAM_3.MARTS` — one table per life situation.
> Created as tables (not views) for Lightdash performance.

### 2.1 Inflation Impact
- [ ] **2.1.1** Create schema `MARTS`
- [ ] **2.1.2** Create `mart_inflation_impact` table
  - Source: `stg_fred_timeseries` WHERE category = 'cpi'
  - Pivot CPI series into columns: `cpi_all`, `cpi_food`, `cpi_energy`, `cpi_medical`, `cpi_rent`, `cpi_education`, `cpi_transport`
  - Compute YoY pct change for each: `(value / LAG(value, 12) OVER (...)) - 1`
  - Compute cumulative purchasing power index (base 100 = earliest month)
  - Grain: one row per month
- [ ] **2.1.3** Verify row counts and spot-check YoY values against known CPI releases

### 2.2 Housing Affordability
- [ ] **2.2.1** Create `mart_housing_affordability` table
  - Sources: `stg_fred_timeseries` series: MSPUS, CSUSHPISA, MORTGAGE30US, CUSR0000SEHA, HOUST, MEHOINUSA672N, FIXHAI
  - Compute `home_price_to_income_ratio`: MSPUS / (MEHOINUSA672N / 12) — interpolate annual income to quarterly
  - Compute `monthly_mortgage_payment`: standard amortization formula using MSPUS (20% down) and MORTGAGE30US
  - Compute `mortgage_pct_of_income`: monthly_mortgage_payment / (MEHOINUSA672N / 12)
  - Include rent CPI index and housing starts
  - Grain: monthly (with NULLs for quarterly-only series in non-quarter months)
- [ ] **2.2.2** Verify ratios make sense (home price/income ratio ~4-6x in recent years)

### 2.3 Savings Health
- [ ] **2.3.1** Create `mart_savings_health` table
  - Sources: PSAVERT, SAVINGSL, FEDFUNDS, CPIAUCSL, DGS10
  - Compute `real_fed_funds_rate`: FEDFUNDS - YoY CPI change
  - Compute `real_10y_yield`: DGS10 - YoY CPI change
  - Include personal savings rate and savings level
  - Grain: monthly
- [ ] **2.3.2** Verify real rates (should be negative during 2021-2022 high inflation)

### 2.4 Debt Burden
- [ ] **2.4.1** Create `mart_debt_burden` table
  - Sources: MORTGAGE30US, TERMCBCCALLNS, FEDFUNDS, TDSP, TOTALSL, REVOLSL, NONREVSL
  - Compute `credit_card_spread`: TERMCBCCALLNS - FEDFUNDS
  - Compute `revolving_pct_of_total`: REVOLSL / TOTALSL
  - Include debt service ratio (TDSP) — already a clean percentage
  - Grain: monthly (quarterly series forward-filled)
- [ ] **2.4.2** Verify credit card rates (~20%+ recently), debt service ratio (~10-13%)

### 2.5 Investment Performance
- [ ] **2.5.1** Create `mart_investment_performance` table
  - Sources: `stg_market_returns` + CPIAUCSL for inflation adjustment
  - Compute monthly returns per asset class (last close of month)
  - Compute `real_return`: nominal monthly return - monthly inflation rate
  - Compute `cumulative_return`: running product of (1 + monthly_return)
  - Compute `drawdown`: current value / running max - 1
  - Compute `rolling_12m_return` and `rolling_12m_volatility` (stddev)
  - Include VIX monthly average as fear gauge
  - Grain: one row per ticker per month
- [ ] **2.5.2** Verify SPY cumulative return and drawdown during COVID (Mar 2020) and 2022

### 2.6 Global Comparison
- [ ] **2.6.1** Create `mart_global_comparison` table
  - Source: `stg_worldbank_countries`
  - Pivot indicators into columns per country-year: `gdp_per_capita`, `inflation_rate`, `unemployment`, `savings_rate`, `gini_index`, `income_share_top10`, `real_interest_rate`, `life_expectancy`, `remittances`, `ppp_factor`
  - Add `us_rank` for each indicator (where does the US fall among the 15 countries?)
  - Grain: one row per country per year
- [ ] **2.6.2** Verify US GDP per capita (~$65-80K PPP), Gini (~41)

**Phase 2 deliverable:** 6 mart tables, all verified with sanity checks.

---

## Phase 3: Cortex AI Summaries

> `DB_TEAM_3.INSIGHTS` — LLM-generated plain-English advice per topic.

### 3.1 Summary Generation
- [ ] **3.1.1** Create schema `INSIGHTS`
- [ ] **3.1.2** Create `advisor_current_snapshot` view
  - Pull the most recent value for each key metric across all 6 marts
  - One row per topic with the 4-5 most important numbers as columns
- [ ] **3.1.3** Create `advisor_summaries` table
  - For each of the 6 topics, call `SNOWFLAKE.CORTEX.COMPLETE('llama3.1-70b', prompt)`
  - Prompt template per topic, injected with real numbers from `advisor_current_snapshot`
  - Columns: `topic`, `summary_text`, `generated_at`
  - Tone: plain English, practical, no jargon, 2-3 sentences per topic
- [ ] **3.1.4** Create `advisor_headline` — one overall summary combining all 6 topics into a 3-sentence "state of your wallet" paragraph

### 3.2 Prompt Templates
- [ ] **3.2.1** Write prompts for each topic:
  - Inflation: "Groceries cost X% more than last year. Energy is up/down Y%. Your dollar buys Z% less than 5 years ago."
  - Housing: "A median home costs $Xk. At current rates, monthly payment is $Y — that's Z% of median income."
  - Savings: "The average American saves X% of income. After inflation, savings accounts earn Y% real return."
  - Debt: "Credit card rates are at X%, the highest since Y. The average household spends Z% of income on debt payments."
  - Investments: "The S&P 500 is up/down X% this year. After inflation, real returns are Y%. Gold is up Z%."
  - Global: "Among G7 nations, the US ranks #X in GDP per capita but #Y in inequality."
- [ ] **3.2.2** Test each prompt, iterate on tone until output is natural and accurate

**Phase 3 deliverable:** `advisor_summaries` table with 6 AI-generated insights + 1 headline.

---

## Phase 4: Lightdash Dashboards

> 6 dashboard tabs + 1 overview. Each tab has charts + Cortex "Advisor Says" card.

### 4.1 Lightdash Setup
- [ ] **4.1.1** Configure Lightdash project connection to DB_TEAM_3
- [ ] **4.1.2** Create Lightdash YAML metrics layer (or connect directly to marts)

### 4.2 Dashboard: Overview
- [ ] **4.2.1** "Advisor Says" headline card (from `advisor_headline`)
- [ ] **4.2.2** 6 KPI tiles — one key number per topic (latest inflation, mortgage rate, savings rate, debt service ratio, S&P YTD return, US GDP rank)
- [ ] **4.2.3** Navigation to 6 detail tabs

### 4.3 Dashboard: Inflation Impact
- [ ] **4.3.1** Line chart: CPI by category (food, energy, medical, rent, education, transport) — YoY % change over time
- [ ] **4.3.2** Metric card: "Your dollar today" — purchasing power index (100 = 5 years ago)
- [ ] **4.3.3** "Advisor Says" text card from Cortex

### 4.4 Dashboard: Housing Affordability
- [ ] **4.4.1** Dual-axis chart: median home price (left) vs mortgage rate (right) over time
- [ ] **4.4.2** Line chart: mortgage payment as % of median income
- [ ] **4.4.3** Metric card: current home-price-to-income ratio
- [ ] **4.4.4** "Advisor Says" text card

### 4.5 Dashboard: Savings Health
- [ ] **4.5.1** Line chart: personal savings rate over time (highlight recessions)
- [ ] **4.5.2** Line chart: real interest rate (what savings actually earn after inflation)
- [ ] **4.5.3** "Advisor Says" text card

### 4.6 Dashboard: Debt Burden
- [ ] **4.6.1** Line chart: credit card rate vs mortgage rate vs fed funds rate
- [ ] **4.6.2** Area chart: total consumer credit (revolving vs non-revolving stacked)
- [ ] **4.6.3** Line chart: household debt service ratio
- [ ] **4.6.4** "Advisor Says" text card

### 4.7 Dashboard: Investment Performance
- [ ] **4.7.1** Line chart: cumulative real returns — SPY vs AGG vs GLD vs BTC (rebased to 100)
- [ ] **4.7.2** Bar chart: rolling 12-month returns by asset class
- [ ] **4.7.3** Line chart: VIX (fear gauge) with annotations for major events
- [ ] **4.7.4** "Advisor Says" text card

### 4.8 Dashboard: Global Comparison
- [ ] **4.8.1** Horizontal bar chart: GDP per capita by country (US highlighted)
- [ ] **4.8.2** Scatter plot: GDP per capita (x) vs Gini index (y) — inequality vs wealth
- [ ] **4.8.3** Table: US rank across all indicators
- [ ] **4.8.4** "Advisor Says" text card

**Phase 4 deliverable:** 7 Lightdash dashboard pages, all interactive, Cortex cards populated.

---

## Phase 5: Polish & Demo Prep

- [ ] **5.1** Add dashboard title, descriptions, and source citations
- [ ] **5.2** Test all filters and drill-downs
- [ ] **5.3** Prepare 2-minute demo walkthrough script
- [ ] **5.4** Screenshot key visuals for presentation slides

---

## Execution Order & Time Estimates

| Phase | Tasks | Depends On | Parallel? |
|-------|-------|-----------|-----------|
| **1: Staging** (1.1, 1.2, 1.3) | 3 views | Phase 0 (done) | All 3 in parallel |
| **2: Marts** (2.1-2.6) | 6 tables | Phase 1 | All 6 in parallel |
| **3: Cortex** (3.1-3.2) | 2 tasks | Phase 2 | Sequential |
| **4: Dashboards** (4.1-4.8) | 8 tasks | Phase 2 + 3 | Parallel per tab |
| **5: Polish** | 4 tasks | Phase 4 | Sequential |

### Critical Path

```
Phase 1 (staging) → Phase 2 (marts) → Phase 3 (cortex) → Phase 4 (dashboards) → Phase 5 (polish)
```

### Parallelism Opportunities

- Phase 1: all 3 staging views are independent
- Phase 2: all 6 marts are independent (each reads only from staging)
- Phase 4: dashboard tabs 4.3-4.8 are independent (can build in any order)
- Phase 3 + 4.2 (overview) depend on all marts being complete

---

## Files Produced

```
DB_TEAM_3.STAGING/
  stg_fred_timeseries          (view)
  stg_market_returns           (view)
  stg_worldbank_countries      (view)

DB_TEAM_3.MARTS/
  mart_inflation_impact        (table)
  mart_housing_affordability   (table)
  mart_savings_health          (table)
  mart_debt_burden             (table)
  mart_investment_performance  (table)
  mart_global_comparison       (table)

DB_TEAM_3.INSIGHTS/
  advisor_current_snapshot     (view)
  advisor_summaries            (table)
  advisor_headline             (table)
```
