import { InflationBreakdown, ApiBenchmarks } from '../types';

/**
 * Map user spending categories to their CPI YoY field names in ApiBenchmarks.inflation
 */
export const CATEGORY_SERIES: Record<string, { field: keyof ApiBenchmarks['inflation']; label: string }> = {
  food:       { field: 'cpiFoodYoy',           label: 'Food' },
  transport:  { field: 'cpiTransportationYoy', label: 'Transportation' },
  healthcare: { field: 'cpiMedicalYoy',        label: 'Healthcare' },
  education:  { field: 'cpiEducationYoy',      label: 'Education' },
  energy:     { field: 'cpiEnergyYoy',         label: 'Energy' },
};

type SpendingInput = {
  food: number;
  transport: number;
  healthcare: number;
  education: number;
  energy: number;
};

/**
 * Build a cpiYoy record (category key -> YoY rate) from ApiBenchmarks.inflation.
 */
function buildCpiYoyRecord(inflation: ApiBenchmarks['inflation']): Record<string, number> {
  const record: Record<string, number> = {};
  for (const [cat, { field }] of Object.entries(CATEGORY_SERIES)) {
    const val = inflation[field];
    record[cat] = typeof val === 'number' ? val : 0;
  }
  return record;
}

/**
 * Personal inflation rate — weighted average of category CPI YoY rates.
 *
 * weights = user spend per category / total spend
 * personalRate = sum(weight_i * categoryRate_i)
 *
 * If total spending is 0, return the headline CPI rate.
 *
 * @param spending - { food, transport, healthcare, education, energy } monthly USD
 * @param cpiYoy - Record<category, yoyPercent> built from ApiBenchmarks.inflation
 * @param headlineCpiYoy - cpiAllYoy from benchmarks.inflation
 */
export function personalInflationRate(
  spending: SpendingInput,
  cpiYoy: Record<string, number>,
  headlineCpiYoy: number,
): number {
  const categories: (keyof SpendingInput)[] = ['food', 'transport', 'healthcare', 'education', 'energy'];
  const totalSpend = categories.reduce((sum, cat) => sum + spending[cat], 0);

  if (totalSpend === 0) {
    return headlineCpiYoy;
  }

  return categories.reduce((rate, cat) => {
    const weight = spending[cat] / totalSpend;
    const categoryRate = cpiYoy[cat] ?? 0;
    return rate + weight * categoryRate;
  }, 0);
}

/**
 * Delta between personal rate and national headline CPI.
 * Positive = your inflation is higher than average.
 */
export function personalVsNational(personalRate: number, nationalRate: number): number {
  return personalRate - nationalRate;
}

/**
 * What the user's current monthly spending basket will cost in N years.
 * futureCost = monthlySpend * 12 * (1 + personalRate/100)^years
 * purchasingPowerLoss = futureCost - currentAnnualSpend
 */
export function purchasingPowerErosion(
  monthlySpend: number,
  personalRatePercent: number,
  years: number,
): { futureAnnualCost: number; loss: number } {
  const currentAnnualSpend = monthlySpend * 12;
  const futureAnnualCost = currentAnnualSpend * Math.pow(1 + personalRatePercent / 100, years);
  const loss = futureAnnualCost - currentAnnualSpend;
  return { futureAnnualCost, loss };
}

/**
 * Which spending category has the highest inflation rate.
 * Returns the category label (e.g., "Healthcare").
 */
export function worstCategory(cpiYoy: Record<string, number>): string {
  const categories = Object.keys(CATEGORY_SERIES);
  let worstLabel = CATEGORY_SERIES[categories[0]].label;
  let worstRate = cpiYoy[categories[0]] ?? 0;

  for (const cat of categories) {
    const rate = cpiYoy[cat] ?? 0;
    if (rate > worstRate) {
      worstRate = rate;
      worstLabel = CATEGORY_SERIES[cat].label;
    }
  }

  return worstLabel;
}

/**
 * Full inflation breakdown for the UI.
 * Accepts ApiBenchmarks.inflation directly.
 */
export function analyzeInflation(
  spending: SpendingInput,
  inflation: ApiBenchmarks['inflation'],
  yearsToRetire: number,
): InflationBreakdown {
  const categories: (keyof SpendingInput)[] = ['food', 'transport', 'healthcare', 'education', 'energy'];
  const totalSpend = categories.reduce((sum, cat) => sum + spending[cat], 0);

  const headlineCpiYoy = inflation.cpiAllYoy;
  const cpiYoy = buildCpiYoyRecord(inflation);

  const personalRate = personalInflationRate(spending, cpiYoy, headlineCpiYoy);
  const nationalRate = headlineCpiYoy;
  const delta = personalVsNational(personalRate, nationalRate);

  const monthlySpend = totalSpend;
  const { loss } = purchasingPowerErosion(monthlySpend, personalRate, yearsToRetire);

  const categoryBreakdown = categories.map((cat) => {
    const { label, field } = CATEGORY_SERIES[cat];
    const nationalCategoryRate = cpiYoy[cat] ?? 0;
    const weight = totalSpend > 0 ? spending[cat] / totalSpend : 0;
    const userRate = weight * nationalCategoryRate;
    // Keep seriesId for backward compat with chart component — use field name as identifier
    return {
      name: label,
      userRate,
      nationalRate: nationalCategoryRate,
      seriesId: field as string,
    };
  });

  return {
    personalRate,
    nationalRate,
    delta,
    categories: categoryBreakdown,
    worstCategory: worstCategory(cpiYoy),
    purchasingPowerLoss: loss,
  };
}
