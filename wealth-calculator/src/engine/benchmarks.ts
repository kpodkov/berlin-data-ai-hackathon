import { BenchmarkComparison, ApiBenchmarks } from '../types';
import { monthlyDebtService } from './debt';

/**
 * Compare user income to national median.
 * Returns ratio: 1.0 = at median, 1.5 = 50% above, 0.8 = 20% below.
 */
export function incomeVsMedian(userIncome: number, medianIncome: number): number {
  const income = Math.max(0, userIncome);
  if (medianIncome <= 0) return 0;
  return income / medianIncome;
}

/**
 * User savings rate vs national.
 * userRate = monthlyInvestment / (annualIncome/12) * 100
 * Returns delta: positive = above national, negative = below.
 */
export function savingsRateDelta(
  monthlyInvestment: number,
  annualIncome: number,
  nationalSavingsRate: number,
): number {
  const investment = Math.max(0, monthlyInvestment);
  const income = Math.max(0, annualIncome);

  const monthlyIncome = income / 12;
  const userRate = monthlyIncome === 0 ? 0 : (investment / monthlyIncome) * 100;

  return userRate - nationalSavingsRate;
}

/**
 * Housing cost burden = monthlyHousing / monthlyIncome * 100.
 * Flag: > 30% = cost-burdened, > 50% = severely.
 */
export function housingBurden(monthlyHousing: number, monthlyIncome: number): number {
  const housing = Math.max(0, monthlyHousing);
  const income = Math.max(0, monthlyIncome);
  if (income === 0) return 0;
  return (housing / income) * 100;
}

/**
 * Debt-to-income ratio vs national.
 * userDTI = monthlyDebtService / monthlyIncome * 100
 * Returns delta vs national TDSP.
 */
export function dtiDelta(
  monthlyDebtService: number,
  monthlyIncome: number,
  nationalDTI: number,
): number {
  const service = Math.max(0, monthlyDebtService);
  const income = Math.max(0, monthlyIncome);

  const userDTI = income === 0 ? 0 : (service / income) * 100;
  return userDTI - nationalDTI;
}

/**
 * Full benchmark comparison using all available benchmarks.
 */
export function compareToBenchmarks(
  annualIncome: number,
  monthlyInvestment: number,
  monthlyHousing: number,
  ccDebt: number,
  otherDebt: number,
  benchmarks: ApiBenchmarks,
): BenchmarkComparison {
  const income = Math.max(0, annualIncome);
  const investment = Math.max(0, monthlyInvestment);
  const housing = Math.max(0, monthlyHousing);
  const cc = Math.max(0, ccDebt);
  const other = Math.max(0, otherDebt);

  const monthlyIncome = income / 12;
  const debtService = monthlyDebtService(cc, other);

  return {
    incomeVsMedian: incomeVsMedian(income, benchmarks.housing.medianIncomeAnnual),
    savingsRateVsNational: savingsRateDelta(investment, income, benchmarks.savings.savingsRate),
    housingBurdenPct: housingBurden(housing, monthlyIncome),
    dtiVsNational: dtiDelta(debtService, monthlyIncome, benchmarks.debt.debtServiceRatio),
  };
}
