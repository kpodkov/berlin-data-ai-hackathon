import { RiskTolerance, InvestmentReturn } from '../types';

interface AllocationWeights {
  equityTicker: string;
  equityWeight: number;
  bondTicker: string;
  bondWeight: number;
}

/**
 * Map risk tolerance to asset allocation.
 * conservative: 40% SPY + 60% AGG
 * moderate:     70% SPY + 30% AGG
 * aggressive:   90% QQQ + 10% AGG
 */
export function getAllocation(risk: RiskTolerance): AllocationWeights {
  switch (risk) {
    case 'conservative':
      return {
        equityTicker: 'SPY',
        equityWeight: 0.4,
        bondTicker: 'AGG',
        bondWeight: 0.6,
      };
    case 'moderate':
      return {
        equityTicker: 'SPY',
        equityWeight: 0.7,
        bondTicker: 'AGG',
        bondWeight: 0.3,
      };
    case 'aggressive':
      return {
        equityTicker: 'QQQ',
        equityWeight: 0.9,
        bondTicker: 'AGG',
        bondWeight: 0.1,
      };
  }
}

/**
 * Compute CAGR for a ticker from monthly investment return rows.
 * Finds the earliest and latest monthlyClose for the ticker,
 * then computes CAGR = (latest/earliest)^(1/years) - 1.
 * Returns 0 if fewer than 2 data points exist.
 */
function cagrFromReturns(ticker: string, returns: InvestmentReturn[]): number {
  const rows = returns
    .filter((r) => r.seriesId === ticker && r.monthlyClose > 0)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  if (rows.length < 2) return 0;

  const earliest = rows[0];
  const latest = rows[rows.length - 1];

  // Parse year portion from "YYYY-MM-DD" month keys
  const startYear =
    new Date(earliest.monthKey).getFullYear() +
    new Date(earliest.monthKey).getMonth() / 12;
  const endYear =
    new Date(latest.monthKey).getFullYear() +
    new Date(latest.monthKey).getMonth() / 12;

  const years = endYear - startYear;
  if (years <= 0) return 0;

  return Math.pow(latest.monthlyClose / earliest.monthlyClose, 1 / years) - 1;
}

/**
 * Compute blended annual return from ETF monthly return data.
 * Derives CAGR from full price history (favors longer history for stability).
 * Falls back to 0 if the ticker is not present.
 */
export function blendedReturn(
  risk: RiskTolerance,
  investmentReturns: InvestmentReturn[],
): number {
  const allocation = getAllocation(risk);

  const equityCagr = cagrFromReturns(allocation.equityTicker, investmentReturns);
  const bondCagr = cagrFromReturns(allocation.bondTicker, investmentReturns);

  return (
    equityCagr * allocation.equityWeight +
    bondCagr * allocation.bondWeight
  );
}
