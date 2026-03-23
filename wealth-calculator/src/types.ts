// Tier 1 — Quick Start (always collected)
export interface Tier1Inputs {
  age: number;                    // 18–80
  annualIncome: number;           // USD, > 0
  monthlyInvestment: number;      // USD, >= 0
}

// Tier 2 — Financial Snapshot
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type HousingStatus = 'rent' | 'own';

export interface Tier2Inputs {
  currentSavings: number;
  riskTolerance: RiskTolerance;
  housingStatus: HousingStatus;
  monthlyHousingCost: number;
  creditCardDebt: number;
  otherDebt: number;
}

// Tier 3 — Personal Inflation
export interface Tier3Inputs {
  monthlyFood: number;
  monthlyTransport: number;
  monthlyHealthcare: number;
  monthlyEducation: number;
  monthlyEnergy: number;
}

// Combined user inputs
export interface UserInputs {
  tier1: Tier1Inputs;
  tier2?: Tier2Inputs;
  tier3?: Tier3Inputs;
}

// API response types from FastAPI backend

export interface ApiBenchmarks {
  inflation: {
    obsMonth: string;
    cpiAll?: number;
    cpiFood?: number;
    cpiEnergy?: number;
    cpiMedical?: number;
    cpiEducation?: number;
    cpiTransportation?: number;
    cpiRent?: number;
    cpiAllYoy: number;
    cpiFoodYoy: number;
    cpiEnergyYoy: number;
    cpiMedicalYoy: number;
    cpiEducationYoy: number;
    cpiTransportationYoy: number;
    cpiRentYoy: number;
    purchasingPowerIndex: number;
  };
  debt: {
    obsMonth: string;
    mortgageRate: number;
    creditCardRate: number;
    fedFundsRate: number;
    debtServiceRatio: number;
  };
  housing: {
    obsMonth: string;
    medianHomePrice: number;
    mortgageRate: number;
    medianIncomeAnnual: number;
    monthlyMortgagePayment?: number;
    homePriceToIncomeRatio: number;
    mortgagePctOfIncome: number;
  };
  savings: {
    obsMonth: string;
    savingsRate: number;
    fedFundsRate?: number;
    treasury10y: number;
    cpiYoy: number;
    realFedFunds?: number;
    realTreasury10y?: number;
  };
}

export interface InvestmentReturn {
  seriesId: string;
  title: string;
  assetClass: string;
  monthKey: string;
  monthlyClose: number;
  monthlyReturnPct: number;
  cumulativeReturnPct: number;
  rolling12mReturnPct: number;
  drawdownPct: number;
}

export interface InflationMonth {
  obsMonth: string;
  cpiAllYoy: number;
  cpiFoodYoy: number;
  cpiEnergyYoy: number;
  cpiMedicalYoy: number;
  cpiEducationYoy: number;
  cpiTransportationYoy: number;
  cpiRentYoy: number;
}

export interface EconData {
  benchmarks: ApiBenchmarks;
  investmentReturns: InvestmentReturn[];
  inflationHistory: InflationMonth[];
}

// Calculation results
export interface ProjectionYear {
  age: number;
  year: number;
  nominal: number;
  real: number;
  contributions: number;
  growth: number;
}

export interface ProjectionResult {
  conservative: ProjectionYear[];
  moderate: ProjectionYear[];
  aggressive: ProjectionYear[];
  yearsToRetire: number;
  yearsTo100k: number | null;
}

export interface DebtAnalysis {
  creditCardAnnualInterest: number;
  creditCardPayoffMonths: number;
  totalDebtServiceMonthly: number;
  debtToIncomeRatio: number;
  netInvestableIncome: number;
}

export interface BenchmarkComparison {
  incomeVsMedian: number;        // ratio (1.0 = at median)
  savingsRateVsNational: number; // delta (positive = above)
  housingBurdenPct: number;      // % of income
  dtiVsNational: number;         // delta
}

export interface InflationBreakdown {
  personalRate: number;
  nationalRate: number;
  delta: number;
  categories: {
    name: string;
    userRate: number;
    nationalRate: number;
    seriesId: string;
  }[];
  worstCategory: string;
  purchasingPowerLoss: number;  // over retirement horizon
}

// Tier completion state
export type TierState = 'locked' | 'unlocked' | 'complete';

export interface AppState {
  tier1State: TierState;
  tier2State: TierState;
  tier3State: TierState;
}

// --- Cortex AI Response Types ---

export interface ActionItem {
  priority: number;
  title: string;
  explanation: string;
}

export interface ActionPlanResponse {
  actions: ActionItem[];
  disclaimer: string;
}

export interface EconomicBriefingResponse {
  briefing: string;
  dataDate: string;
}

export interface ExplainResponse {
  explanation: string;
  metric: string;
}

export interface SentimentResponse {
  score: number;
  label: 'optimistic' | 'mixed' | 'cautious';
  color: 'green' | 'amber' | 'red';
}

export interface EducationAnswer {
  question: string;
  answer: string;
}

// Profile sent to action plan endpoint (no PII)
export interface ActionPlanRequest {
  age: number;
  income: number;
  monthlyInvestment: number;
  currentSavings: number;
  creditCardDebt: number;
  otherDebt: number;
  housingCost: number;
  riskTolerance: string;
}

// --- Consumer Insights Types ---

export interface ConsumerTierStats {
  wealthTier: string;
  totalUsers: number;
  avgFinancialScore: number;
  dominantConcern: string;
  typicalSpending: string;
  macroRegime: string;
}

export interface ConsumerInsights {
  userTier: string;
  tiers: ConsumerTierStats[];
  spendingDistribution: { spendingWillingness: string; users: number }[];
  topSegments: { segment: string; users: number; avgScore: number }[];
  consumerConfidence: { confidenceRatio: number; totalUsers: number } | null;
  euContext: {
    eurUsdRate: string;
    eurUsdTrend: string;
    euInflationRate: string;
    ecbDepositRate: string;
  } | null;
  totalUsers: number;
  source: string;
}

// Defaults
export const TIER2_DEFAULTS: Tier2Inputs = {
  currentSavings: 0,
  riskTolerance: 'moderate',
  housingStatus: 'rent',
  monthlyHousingCost: 0,
  creditCardDebt: 0,
  otherDebt: 0,
};

export const TIER3_DEFAULTS: Tier3Inputs = {
  monthlyFood: 0,
  monthlyTransport: 0,
  monthlyHealthcare: 0,
  monthlyEducation: 0,
  monthlyEnergy: 0,
};
