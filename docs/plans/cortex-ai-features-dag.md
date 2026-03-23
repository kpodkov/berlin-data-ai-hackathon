# Cortex AI Features — Executable DAG

> Cortex AI is the primary value proposition. Charts and benchmarks are supporting context.
> 11 tasks, 5 waves. Critical path: t1 → t3 → t5 → t8

## DAG

```
Wave 1:  t1(Cortex SQL)    t2(Types+Hook)
              |                  |
Wave 2:    t3(ActionPlan API)   |
              |                  |
Wave 3:  t5(ActionPlan UI)  t4(Briefing API)  t7(Explain API)  t10(Sentiment)
              |                  |                  |
Wave 4:      |              t6(Briefing UI)    t9(Explain btn)   t11(Education)
              |                  |                  |
Wave 5:    t8(App.tsx Integration)
```

**Critical path:** t1 → t3 → t5 → t8 (Action Plan = MVP hero feature)

---

## Wave 1 — Infrastructure (parallel)

### t1: Cortex SQL Module

- **Agent:** developer
- **Files:** `api/cortex.py`
- **Accept:** `cortex_complete(model, prompt)`, `cortex_sentiment(text)`, `cortex_summarize(text)` wrappers using existing `db.query()`

### t2: Frontend Types + Hook

- **Agent:** developer
- **Files:** `src/types.ts`, `src/hooks/useCortex.ts`
- **Accept:** TypeScript types for all Cortex responses. Hooks: `useActionPlan(tier1, tier2)`, `useEconomicBriefing()`, `useExplain(metric, value)` with loading/error/data state

---

## Wave 2 — MVP Backend (critical path)

### t3: Action Plan Endpoint

- **Agent:** developer
- **Depends:** t1
- **Files:** `api/routes/cortex.py`, `api/main.py`
- **Accept:** `POST /api/cortex/action-plan` takes anonymized profile + queries latest MARTS data + calls `mistral-large2` → returns 3 prioritized actions as JSON. Cache 300s.

---

## Wave 3 — MVP Frontend + Enhancement Backends (parallel)

### t5: ActionPlan UI (critical path)

- **Agent:** developer
- **Depends:** t2, t3
- **Files:** `src/components/results/ActionPlanCard.tsx`
- **Accept:** Hero card with gradient border, 3 numbered action items, loading skeleton, error retry. FIRST element in results panel.

### t4: Economic Briefing Endpoint

- **Agent:** developer
- **Depends:** t1
- **Files:** `api/routes/cortex.py`
- **Accept:** `GET /api/cortex/briefing` → 2-3 sentence AI summary from MARTS data. Cache 24hr.

### t7: Explain Endpoint

- **Agent:** developer
- **Depends:** t1
- **Files:** `api/routes/cortex.py`
- **Accept:** `POST /api/cortex/explain` → 2-sentence contextual explanation via `llama3.1-8b`. Cache 1hr.

### t10: Sentiment Endpoint + Badge

- **Agent:** developer
- **Depends:** t1, t2
- **Files:** `api/routes/cortex.py`, `src/components/layout/SentimentBadge.tsx`
- **Accept:** `GET /api/cortex/sentiment` → score + label + color. Badge in TopBar.

---

## Wave 4 — Enhancement Frontends (parallel)

### t6: Economic Briefing UI

- **Agent:** developer
- **Depends:** t2, t4
- **Files:** `src/components/results/EconomicBriefing.tsx`
- **Accept:** Slim banner below ActionPlan, above chart. Sparkle icon + cached AI text.

### t9: BenchmarkCard Explain Button

- **Agent:** developer
- **Depends:** t2, t7
- **Files:** `src/components/results/BenchmarkCard.tsx`
- **Accept:** "?" button on each card → popover with 2-sentence AI explanation.

### t11: Education Q&A

- **Agent:** developer
- **Depends:** t1, t2
- **Files:** `api/routes/cortex.py`, `src/components/results/EducationQA.tsx`
- **Accept:** `POST /api/cortex/ask` + UI with text input, response area, suggested question chips.

---

## Wave 5 — Integration

### t8: App.tsx Wiring

- **Agent:** developer
- **Depends:** t5, t6, t9, t10
- **Files:** `src/App.tsx`, `src/components/results/Tier1Results.tsx`, `Tier2Results.tsx`
- **Accept:** Results panel order: ActionPlanCard (hero) → EconomicBriefing → SentimentBadge → Chart → Benchmarks with explain → Tier results. All Cortex features degrade gracefully.

---

## Cache Strategy

| Feature | TTL | Key |
|---|---|---|
| Action Plan | 300s | hash(user inputs) |
| Economic Briefing | 24hr | none (global) |
| Explain | 1hr | metric + bucketed value |
| Sentiment | 24hr | none (global) |
| Education | permanent (pre-cached) / 1hr (novel) | question text |
