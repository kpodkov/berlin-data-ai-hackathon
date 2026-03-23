import { ProjectionYear } from '../types';

/**
 * Future value with monthly contributions (FV of annuity).
 * FV = principal × (1 + r)^n + monthly × ((1 + r_m)^(n×12) - 1) / r_m
 * where r_m = (1 + r)^(1/12) - 1
 */
export function futureValue(
  principal: number,
  monthlyContrib: number,
  annualRate: number,
  years: number,
): number {
  if (years <= 0) return principal;

  if (annualRate === 0) {
    return principal + monthlyContrib * years * 12;
  }

  const rMonthly = Math.pow(1 + annualRate, 1 / 12) - 1;
  const months = years * 12;
  const principalFV = principal * Math.pow(1 + annualRate, years);
  const contribFV =
    monthlyContrib * (Math.pow(1 + rMonthly, months) - 1) / rMonthly;
  return principalFV + contribFV;
}

/**
 * Year-by-year projection from current age to targetAge (default 70).
 * Returns one entry per year including the starting year (age = currentAge).
 */
export function yearByYearProjection(
  currentAge: number,
  principal: number,
  monthlyContrib: number,
  annualReturn: number,
  inflationRate: number,
  targetAge: number = 70,
): ProjectionYear[] {
  const currentYear = new Date().getFullYear();
  const result: ProjectionYear[] = [];

  let balance = principal;
  const rMonthly =
    annualReturn === 0 ? 0 : Math.pow(1 + annualReturn, 1 / 12) - 1;

  for (let age = currentAge; age <= targetAge; age++) {
    const yearsElapsed = age - currentAge;
    const nominalAtStart = balance;

    // Real value: deflate by cumulative inflation
    const real =
      inflationRate === 0
        ? nominalAtStart
        : nominalAtStart / Math.pow(1 + inflationRate, yearsElapsed);

    // Cumulative contributions up to this point (excluding principal)
    const contributions = monthlyContrib * 12 * yearsElapsed;

    // Growth = current nominal minus principal minus contributions
    const growth = Math.max(0, nominalAtStart - principal - contributions);

    result.push({
      age,
      year: currentYear + yearsElapsed,
      nominal: nominalAtStart,
      real,
      contributions,
      growth,
    });

    // Advance balance by one year of compounding + contributions
    if (annualReturn === 0) {
      balance = balance + monthlyContrib * 12;
    } else {
      balance =
        balance * Math.pow(1 + annualReturn, 1) +
        monthlyContrib * (Math.pow(1 + rMonthly, 12) - 1) / rMonthly;
    }
  }

  return result;
}

/**
 * Iterative solver: how many months until portfolio reaches target?
 * Counts month by month, max 600 months (50 years).
 * Returns months / 12, or null if unreachable.
 */
export function yearsToMilestone(
  principal: number,
  monthlyContrib: number,
  annualReturn: number,
  target: number,
): number | null {
  if (target <= 0) return 0;
  if (principal >= target) return 0;

  // If no growth possible and no contributions, unreachable
  if (annualReturn === 0 && monthlyContrib === 0) return null;
  // If rate is 0 and contributions can't reach target, check directly
  if (annualReturn === 0 && monthlyContrib <= 0) return null;

  const rMonthly =
    annualReturn === 0 ? 0 : Math.pow(1 + annualReturn, 1 / 12) - 1;

  let balance = principal;
  const maxMonths = 600;

  for (let month = 1; month <= maxMonths; month++) {
    balance = balance * (1 + rMonthly) + monthlyContrib;
    if (balance >= target) {
      return month / 12;
    }
  }

  return null;
}

/**
 * Simple retirement horizon: 65 - currentAge, minimum 1.
 */
export function retirementHorizon(currentAge: number): number {
  return Math.max(1, 65 - currentAge);
}
