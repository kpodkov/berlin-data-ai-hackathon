import { DebtAnalysis } from '../types';

/**
 * Annual interest cost of credit card debt at given rate.
 * monthlyInterest = debt * (rate/100) / 12
 * annualInterest = monthlyInterest * 12
 */
export function creditCardDrag(ccDebt: number, ccRatePercent: number): number {
  const debt = Math.max(0, ccDebt);
  const rate = Math.max(0, ccRatePercent);
  return debt * (rate / 100);
}

/**
 * Months to pay off debt at minimum payment (2% of balance or $25, whichever greater).
 * Iterative: each month, balance = balance * (1 + monthlyRate) - payment
 * Returns months to reach $0. Cap at 600 months (50 years).
 * Returns 0 if debt is 0.
 */
export function debtPayoffMonths(debt: number, annualRatePercent: number): number {
  const principal = Math.max(0, debt);
  if (principal === 0) return 0;

  const rate = Math.max(0, annualRatePercent);

  if (rate === 0) {
    // Simple division: balance / minimum payment
    const payment = Math.max(25, principal * 0.02);
    return Math.ceil(principal / payment);
  }

  const monthlyRate = rate / 100 / 12;
  let balance = principal;
  const maxMonths = 600;

  for (let month = 1; month <= maxMonths; month++) {
    const payment = Math.max(25, balance * 0.02);
    balance = balance * (1 + monthlyRate) - payment;
    if (balance <= 1) return month;
  }

  return maxMonths;
}

/**
 * Monthly debt service estimate.
 * CC: 2% of balance or $25
 * Other: 1% of balance (simplified)
 */
export function monthlyDebtService(ccDebt: number, otherDebt: number): number {
  const cc = Math.max(0, ccDebt);
  const other = Math.max(0, otherDebt);

  const ccService = cc === 0 ? 0 : Math.max(25, cc * 0.02);
  const otherService = other * 0.01;

  return ccService + otherService;
}

/**
 * Net investable income = monthly income - housing - debt service - current investments.
 * Can be negative (means cash-flow gap).
 */
export function netInvestableIncome(
  monthlyIncome: number,
  monthlyHousing: number,
  ccDebt: number,
  otherDebt: number,
  monthlyInvestment: number,
): number {
  const income = Math.max(0, monthlyIncome);
  const housing = Math.max(0, monthlyHousing);
  const investment = Math.max(0, monthlyInvestment);
  const debtService = monthlyDebtService(ccDebt, otherDebt);

  return income - housing - debtService - investment;
}

/**
 * Full debt analysis combining all above.
 */
export function analyzeDebt(
  ccDebt: number,
  otherDebt: number,
  ccRatePercent: number,
  monthlyIncome: number,
  monthlyHousing: number,
  monthlyInvestment: number,
): DebtAnalysis {
  const cc = Math.max(0, ccDebt);
  const other = Math.max(0, otherDebt);
  const rate = Math.max(0, ccRatePercent);
  const income = Math.max(0, monthlyIncome);

  const creditCardAnnualInterest = creditCardDrag(cc, rate);
  const creditCardPayoffMonths = debtPayoffMonths(cc, rate);
  const totalDebtServiceMonthly = monthlyDebtService(cc, other);

  const annualIncome = income * 12;
  const debtToIncomeRatio =
    annualIncome === 0
      ? 0
      : (totalDebtServiceMonthly * 12) / annualIncome * 100;

  const net = netInvestableIncome(income, monthlyHousing, cc, other, monthlyInvestment);

  return {
    creditCardAnnualInterest,
    creditCardPayoffMonths,
    totalDebtServiceMonthly,
    debtToIncomeRatio,
    netInvestableIncome: net,
  };
}
