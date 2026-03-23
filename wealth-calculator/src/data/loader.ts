import type { EconData, ApiBenchmarks, InvestmentReturn, InflationMonth } from '../types';

let cached: EconData | null = null;

const EMPTY_BENCHMARKS: ApiBenchmarks = {
  inflation: {
    obsMonth: '',
    cpiAllYoy: 0,
    cpiFoodYoy: 0,
    cpiEnergyYoy: 0,
    cpiMedicalYoy: 0,
    cpiEducationYoy: 0,
    cpiTransportationYoy: 0,
    cpiRentYoy: 0,
    purchasingPowerIndex: 0,
  },
  debt: {
    obsMonth: '',
    mortgageRate: 0,
    creditCardRate: 0,
    fedFundsRate: 0,
    debtServiceRatio: 0,
  },
  housing: {
    obsMonth: '',
    medianHomePrice: 0,
    mortgageRate: 0,
    medianIncomeAnnual: 0,
    homePriceToIncomeRatio: 0,
    mortgagePctOfIncome: 0,
  },
  savings: {
    obsMonth: '',
    savingsRate: 0,
    treasury10y: 0,
    cpiYoy: 0,
  },
};

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[loader] ${url} returned ${response.status} — using fallback`);
      return fallback;
    }
    return (await response.json()) as T;
  } catch (err) {
    console.warn(`[loader] Failed to fetch ${url}:`, err);
    return fallback;
  }
}

export async function loadAllData(): Promise<EconData> {
  if (cached) return cached;

  const [benchmarks, investmentReturns, inflationHistory] = await Promise.all([
    fetchJson<ApiBenchmarks>('/api/benchmarks', EMPTY_BENCHMARKS),
    fetchJson<InvestmentReturn[]>('/api/investment-returns?tickers=SPY,QQQ,AGG,TLT,GLD,VEA', []),
    fetchJson<InflationMonth[]>('/api/inflation-history?months=120', []),
  ]);

  cached = {
    benchmarks,
    investmentReturns,
    inflationHistory,
  };

  return cached;
}
