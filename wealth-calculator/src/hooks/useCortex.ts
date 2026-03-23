import { useState, useEffect, useCallback } from 'react';
import type {
  ActionPlanResponse,
  ActionPlanRequest,
  EconomicBriefingResponse,
  ExplainResponse,
  SentimentResponse,
  EducationAnswer,
  Tier1Inputs,
  Tier2Inputs,
} from '../types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

// Hook: Action Plan (triggered manually, not on mount)
export function useActionPlan() {
  const [data, setData] = useState<ActionPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async (tier1: Tier1Inputs, tier2: Tier2Inputs) => {
    setLoading(true);
    setError(null);
    try {
      const body: ActionPlanRequest = {
        age: tier1.age,
        income: tier1.annualIncome,
        monthlyInvestment: tier1.monthlyInvestment,
        currentSavings: tier2.currentSavings,
        creditCardDebt: tier2.creditCardDebt,
        otherDebt: tier2.otherDebt,
        housingCost: tier2.monthlyHousingCost,
        riskTolerance: tier2.riskTolerance,
      };
      const result = await postJson<ActionPlanResponse>('/api/cortex/action-plan', body);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchPlan };
}

// Hook: Economic Briefing (fetches on mount, cached server-side; supports manual refetch)
export function useEconomicBriefing() {
  const [data, setData] = useState<EconomicBriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getJson<EconomicBriefingResponse>('/api/cortex/briefing')
      .then((result) => { if (!cancelled) setData(result); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load briefing');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { data, loading, error, refetch };
}

// Hook: Explain metric (triggered manually)
export function useExplain() {
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = useCallback(async (metric: string, value: number, context?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postJson<ExplainResponse>('/api/cortex/explain', {
        metric,
        value,
        context: context ?? '',
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get explanation');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, explain, reset };
}

// Hook: Market Sentiment (fetches on mount)
export function useSentiment() {
  const [data, setData] = useState<SentimentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getJson<SentimentResponse>('/api/cortex/sentiment')
      .then((result) => { if (!cancelled) setData(result); })
      .catch(() => { /* silent fail — sentiment is non-critical */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}

// Hook: Education Q&A (triggered manually)
export function useEducation() {
  const [data, setData] = useState<EducationAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (question: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postJson<EducationAnswer>('/api/cortex/ask', { question });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, ask };
}
