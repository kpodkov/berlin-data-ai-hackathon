# Wealth Calculator — Project Summary & Cost Report

> Berlin Data & AI Hackathon · March 23, 2026 · Snowflake Office Berlin

---

## TL;DR

Built a personal finance wealth calculator in one day. It takes user inputs across three progressive tiers, queries live Snowflake MART tables (FRED, Yahoo Finance, ECB, World Bank), and runs Cortex AI for personalized recommendations. All user data stays in the browser. Estimated AI cost per active user session: `~$0.01`.

---

## 🏗 What We Built

A EUR-denominated personal finance web app that meets users where they are — quick inputs first, depth on demand.

**Three input tiers:**
1. Quick start — age, income, savings rate
2. Financial snapshot — assets, debt, housing costs
3. Personal inflation — spending breakdown by category

The app computes wealth trajectories, benchmarks the user against real economic data, surfaces a personal inflation rate, and generates AI-written action plans — all without sending a single user input to Snowflake.

**Tech stack:**

| Layer | Technologies |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS + Recharts |
| Backend | FastAPI + snowflake-connector-python |
| Data | Snowflake MART tables (7 marts, ~5.1M rows total) |
| AI | Snowflake Cortex (mistral-large2, llama3.1-8b, SENTIMENT()) |

Features: dark/light mode, responsive layout, privacy modal, financial disclaimer.

---

## 📋 Feature Inventory

| Feature | Data Source | AI Model | Status |
|---|---|---|---|
| Wealth trajectory projection (3 risk scenarios) | `MART_INVESTMENT_PERFORMANCE` (59 ETFs) | — | Live |
| Income / savings / housing benchmarks | `MART_SAVINGS_HEALTH`, `MART_HOUSING_AFFORDABILITY` | — | Live |
| Debt analysis (CC drag, payoff timeline) | `MART_DEBT_BURDEN` | — | Live |
| Personal inflation rate (weighted CPI basket) | `MART_INFLATION_IMPACT` (7 CPI sub-categories) | — | Live |
| AI Action Plan (3 personalized recommendations) | All MARTs + `MART_CURRENCY_ENVIRONMENT` | mistral-large2 | Live |
| Economic Briefing (AI market summary) | All MARTs | mistral-large2 | Live |
| Explain buttons (contextual metric explanations) | — | llama3.1-8b | Live |
| Market Sentiment badge | All MARTs | `CORTEX.SENTIMENT()` | Live |
| Education Q&A | — | llama3.1-8b | Live |
| Consumer Intelligence (JustWatch benchmarks) | `MART_PERSONALIZED_ADVISOR` (4.75M rows, 10K sample) | — | Live |
| EUR/USD + EU inflation context | `MART_CURRENCY_ENVIRONMENT` (ECB data) | — | Live |
| Dark / light mode | — | — | Live |
| Privacy modal + disclaimer | — | — | Live |

---

## 🗄 Snowflake Data Used

### MART Layer (query targets)

| Table | Rows | Source | Used By |
|---|---|---|---|
| `MART_INFLATION_IMPACT` | `949` | FRED (7 CPI series) | Benchmarks, inflation engine, Cortex prompts |
| `MART_DEBT_BURDEN` | `860` | FRED (rates, credit) | Debt analysis, Cortex prompts |
| `MART_HOUSING_AFFORDABILITY` | `759` | FRED (housing, income) | Housing benchmarks, Cortex prompts |
| `MART_SAVINGS_HEALTH` | `805` | FRED (savings, rates) | Savings benchmarks, Cortex prompts |
| `MART_INVESTMENT_PERFORMANCE` | `15,277` | Yahoo Finance (59 ETFs) | CAGR calculations, wealth projection |
| `MART_CURRENCY_ENVIRONMENT` | `30` | ECB (FX + HICP) | EU context, Cortex prompts |
| `MART_PERSONALIZED_ADVISOR` | `4,750,530` | JustWatch + Cortex AI | Consumer Intelligence (10K sample) |

### RAW Layer (pipeline inputs)

| Source | Series / Tickers | Observations |
|---|---|---|
| FRED | `73` series | `~205,000` |
| Yahoo Finance | `59` tickers | `~323,000` |
| ECB | `30` series | `~8,900` |
| World Bank | `591` indicators | `~14,000` |

---

## 🏛 Architecture

```
Browser (React + TypeScript)
  ├── User inputs (age, income, debt, spending) — NEVER leave the browser
  ├── Calculation engines (projection, debt, inflation, benchmarks) — client-side
  └── API calls → FastAPI backend
                    ├── /api/benchmarks            → MART_INFLATION + DEBT + HOUSING + SAVINGS
                    ├── /api/investment-returns    → MART_INVESTMENT_PERFORMANCE
                    ├── /api/inflation-history     → MART_INFLATION_IMPACT
                    ├── /api/consumer-insights     → MART_PERSONALIZED_ADVISOR (10K sample)
                    ├── /api/cortex/action-plan    → Cortex mistral-large2 + all MARTs
                    ├── /api/cortex/briefing       → Cortex mistral-large2 + all MARTs
                    ├── /api/cortex/explain        → Cortex llama3.1-8b
                    ├── /api/cortex/sentiment      → Cortex SENTIMENT()
                    └── /api/cortex/ask            → Cortex llama3.1-8b
```

Privacy model: all personally identifiable financial inputs are computed client-side. Only anonymous, aggregated economic context is fetched from Snowflake. No user data crosses the API boundary.

---

## 💸 Estimated Cortex AI Costs

Estimates based on approximate token counts per call. Actual costs depend on Snowflake Cortex pricing tier.

| Feature | Model | Tokens/call (est.) | Calls/session | Cost/session (est.) |
|---|---|---|---|---|
| Action Plan | mistral-large2 | `~800 in + ~500 out` | 1–3 | `~$0.005` |
| Economic Briefing | mistral-large2 | `~400 in + ~200 out` | 1 (cached 24 hr) | `~$0.002` |
| Explain buttons | llama3.1-8b | `~150 in + ~100 out` | 3–6 | `~$0.002` |
| Market Sentiment | `CORTEX.SENTIMENT()` | `~100 tokens` | 1 (cached 24 hr) | `~$0.001` |
| Education Q&A | llama3.1-8b | `~100 in + ~200 out` | 2–5 | `~$0.002` |
| **Total per session** | | | | **`~$0.01`** |
| **1,000 users/month** | | | | **`~$10/mo`** |

The Economic Briefing and Sentiment badge are cached for 24 hours — one Cortex call serves all users for the day.

---

## 💰 Agent Token Usage & Cost Estimates

Estimated costs use Anthropic API pricing: Sonnet ~$3/MTok input, ~$15/MTok output (blended ~$6/MTok). Opus ~$15/MTok input, ~$75/MTok output (blended ~$30/MTok). Most subagents ran on Sonnet; the main orchestrator ran on Opus.

### Per-Agent Breakdown

| Agent | Task | Tokens | Tools | Duration | Est. Cost |
|---|---|---|---|---|---|
| **Planning & Research** | | | | | |
| Explore | Docs + platforms structure | `66,399` | 44 | 39min | `$0.40` |
| Explore | Snowflake RAW schema | `119,473` | 31 | 4.5min | `$0.72` |
| Explore | FRED data quality | `102,915` | 14 | 5.2min | `$0.62` |
| Architect | Input schema + data flow | `91,833` | 5 | 2.5min | `$0.55` |
| Designer | UI/UX spec | `92,080` | 6 | 3.0min | `$0.55` |
| Planner | Build DAG | `87,409` | 9 | 2.1min | `$0.52` |
| Planner | Cortex AI DAG | `92,179` | 8 | 2.0min | `$0.55` |
| Knowledge Mgr | Teach Snowflake pipelines | `75,163` | 42 | 8.5min | `$0.45` |
| **Subtotal** | | **`727,451`** | **159** | | **`$4.36`** |
| | | | | | |
| **Data Extraction (Wave 1)** | | | | | |
| Developer | t1: FRED → JSON | `91,442` | 15 | 1.5min | `$0.55` |
| Developer | t2: ETF → JSON | `90,249` | 23 | 2.4min | `$0.54` |
| Developer | t3: Scaffold Vite+React | `88,266` | 26 | 2.8min | `$0.53` |
| Developer | t4: Types + registry | `85,299` | 11 | 1.7min | `$0.51` |
| **Subtotal** | | **`355,256`** | **75** | | **`$2.13`** |
| | | | | | |
| **Engines + Data Layer (Wave 2)** | | | | | |
| Developer | t5: Benchmarks JSON | `83,816` | 7 | 1.0min | `$0.50` |
| Developer | t6: Data loader + hook | `81,703` | 8 | 0.8min | `$0.49` |
| Developer | t7: Projection + allocation | `86,381` | 9 | 1.2min | `$0.52` |
| **Subtotal** | | **`251,900`** | **24** | | **`$1.51`** |
| | | | | | |
| **UI Components (Waves 3–5)** | | | | | |
| Developer | t8: Tier 1 UI (16 components) | `109,367` | 30 | 4.2min | `$0.66` |
| Developer | t9: Debt + benchmark engines | `85,341` | 7 | 0.9min | `$0.51` |
| Developer | t10: Tier 2 UI + charts | `115,474` | 30 | 3.9min | `$0.69` |
| Developer | t11: Inflation engine | `85,496` | 6 | 0.7min | `$0.51` |
| Developer | t12: Tier 3 UI + inflation chart | `101,244` | 22 | 2.1min | `$0.61` |
| **Subtotal** | | **`496,922`** | **95** | | **`$2.98`** |
| | | | | | |
| **Review & Polish** | | | | | |
| Developer | t14: Final polish + README | `86,186` | 17 | 1.4min | `$0.52` |
| Reviewer | t17: Code review | `127,948` | 43 | 2.1min | `$0.77` |
| Judge | MVP evaluation | `121,074` | 32 | 2.3min | `$0.73` |
| Judge | UI component audit | `143,844` | 40 | 2.4min | `$0.86` |
| **Subtotal** | | **`479,052`** | **132** | | **`$2.88`** |
| | | | | | |
| **Snowflake Refactor** | | | | | |
| Developer | FastAPI backend | `85,874` | 17 | 2.0min | `$0.52` |
| Developer | Frontend → API refactor | `116,202` | 37 | 4.1min | `$0.70` |
| **Subtotal** | | **`202,076`** | **54** | | **`$1.22`** |
| | | | | | |
| **Cortex AI Features** | | | | | |
| Explore | Test Cortex capabilities | `116,247` | 18 | 4.2min | `$0.70` |
| Technical Writer | Save DAG plan | `76,538` | 2 | 0.6min | `$0.46` |
| Developer | t1: Cortex SQL module | `84,019` | 15 | 1.4min | `$0.50` |
| Developer | t2: Frontend types + hooks | `84,773` | 6 | 0.7min | `$0.51` |
| Developer | t3: Action Plan endpoint | `85,553` | 10 | 0.9min | `$0.51` |
| Developer | t4+t7+t10: Extra endpoints | `86,012` | 10 | 0.9min | `$0.52` |
| Developer | t5: ActionPlan hero UI | `89,702` | 8 | 0.8min | `$0.54` |
| Developer | t6+t9+t11: Cortex UI | `90,736` | 10 | 1.2min | `$0.54` |
| **Subtotal** | | **`713,580`** | **79** | | **`$4.28`** |
| | | | | | |
| **Enhancements** | | | | | |
| Developer | Wire Economic Briefing | `92,942` | 15 | 1.1min | `$0.56` |
| Developer | Wire Explain buttons | `91,730` | 11 | 1.3min | `$0.55` |
| Developer | Consumer Insights API + UI | `99,578` | 20 | 2.1min | `$0.60` |
| Technical Writer | ECONOMICS.md | `85,557` | 3 | 1.2min | `$0.51` |
| **Subtotal** | | **`369,807`** | **49** | | **`$2.22`** |

### Totals

| Metric | Value |
|---|---|
| Total subagent dispatches | **`~40`** |
| Total tokens (subagents) | **`~3.6M`** |
| Total tool calls (subagents) | **`~667`** |
| Est. subagent cost (Sonnet) | **`~$21.6`** |
| Main orchestrator (Opus, est.) | **`~$15–25`** |
| **Total estimated session cost** | **`~$40–50`** |

> Note: Token counts are from task completion reports. The main orchestrator (Opus 4.6 1M context) token usage is estimated based on conversation length. Actual billing depends on caching, context window utilization, and provider pricing.

---

## 🤖 Agent Work Log

### Phase 1 — Planning & Research
- Explore: inspected `docs/` and `platforms/` structure
- Explore: inspected Snowflake RAW schema data
- Explore: audited FRED data quality and series coverage
- Planner: created executable build DAG (`wealth-calculator-dag.md`)
- Architect: designed input schema and data flow
- Designer: created UI/UX design spec (`wealth-calculator-ui-spec.md`)
- Planner: created Cortex AI features DAG

### Phase 2 — Data Extraction
- Developer (t1): extracted FRED data to JSON
- Developer (t2): extracted ETF data to JSON
- Developer (t3): scaffolded Vite + React + TypeScript project
- Developer (t4): defined TypeScript types and series registry

### Phase 3 — Engines + Data Layer
- Developer (t5): computed benchmarks JSON
- Developer (t6): built data loader and `useEconData` hook
- Developer (t7): built projection and allocation engine

### Phase 4 — UI Components
- Developer (t8): built Tier 1 UI and layout shell (16 components)
- Developer (t9): built debt and benchmark engines
- Developer (t10): built Tier 2 UI and charts
- Developer (t11): built inflation engine
- Developer (t12): built Tier 3 UI and inflation chart
- Tester (t15): wrote test plan and core engine tests (planned)

### Phase 5 — Review & Polish
- Reviewer (t14): final polish and README
- Reviewer (t17): code review pass
- Judge: full MVP evaluation — scored `7–9/10` across all categories
- Judge: UI component audit — `28` components reviewed

### Phase 6 — Snowflake Refactor
- Explore: inspected Snowflake MARTS schema
- Developer: built FastAPI backend with 5 endpoints
- Developer: refactored frontend to consume live API

### Phase 7 — Cortex AI Features
- Explore: tested Cortex AI capabilities (models, token limits, latency)
- Planner: created Cortex features DAG (11 tasks)
- Technical writer: saved DAG plan to `docs/plans/`
- Developer (t1): Cortex SQL module
- Developer (t2): frontend types and hooks
- Developer (t3): Action Plan endpoint
- Developer (t4, t7, t10): Briefing, Explain, Sentiment, Education endpoints
- Developer (t5): ActionPlan hero UI card
- Developer (t6, t9, t10ui, t11): remaining Cortex UI components

### Phase 8 — Enhancements
- Developer: wired Economic Briefing end-to-end
- Developer: wired Explain buttons on BenchmarkCards
- Developer: built Consumer Insights API and UI (JustWatch behavioral data)
- Knowledge manager: documented Snowflake pipeline patterns for data engineer context

---

## 📊 Judge Scores (Self-Evaluation)

Scores reflect the MVP evaluation conducted at end of day.

| Category | Score |
|---|---|
| Technical depth | `8/10` |
| Data utilization | `9/10` |
| AI integration | `8/10` |
| UX / presentation | `7/10` |
| Privacy model | `9/10` |
| Hackathon fit | `8/10` |

---

## 📁 Key Files

| Path | Description |
|---|---|
| `wealth-calculator/` | Full application (frontend + backend) |
| `docs/plans/wealth-calculator-dag.md` | Build DAG used to coordinate agent work |
| `docs/plans/wealth-calculator-mvp.md` | MVP scope definition |
| `docs/design/wealth-calculator-ui-spec.md` | UI/UX design specification |
| `docs/plans/` | Cortex AI features DAG and WBS |
| `streaming_behavior_to_financial_intelligence.md` | JustWatch consumer intelligence methodology |
