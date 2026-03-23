export interface SeriesInfo {
  label: string;
  shortLabel: string;
  category: string;
  unit: string;
}

export const SERIES_REGISTRY: Record<string, SeriesInfo> = {
  A229RX0: {
    label: 'Real Disposable Personal Income: Per Capita',
    shortLabel: 'Real Disposable Income',
    category: 'income',
    unit: 'Chained 2017 Dollars',
  },
  CES0500000003: {
    label: 'Average Hourly Earnings of All Employees, Total Private',
    shortLabel: 'Avg Hourly Earnings',
    category: 'income',
    unit: 'Dollars per Hour',
  },
  CPIAUCSL: {
    label: 'Consumer Price Index for All Urban Consumers: All Items',
    shortLabel: 'CPI All Items',
    category: 'inflation',
    unit: 'Index 1982-1984=100',
  },
  CPIENGSL: {
    label: 'Consumer Price Index for All Urban Consumers: Energy',
    shortLabel: 'CPI Energy',
    category: 'inflation',
    unit: 'Index 1982-1984=100',
  },
  CPIMEDSL: {
    label: 'Consumer Price Index for All Urban Consumers: Medical Care',
    shortLabel: 'CPI Medical',
    category: 'inflation',
    unit: 'Index 1982-1984=100',
  },
  CPIUFDSL: {
    label: 'Consumer Price Index for All Urban Consumers: Food',
    shortLabel: 'CPI Food',
    category: 'inflation',
    unit: 'Index 1982-1984=100',
  },
  CSUSHPISA: {
    label: 'S&P/Case-Shiller U.S. National Home Price Index',
    shortLabel: 'Case-Shiller HPI',
    category: 'housing',
    unit: 'Index Jan 2000=100',
  },
  CUSR0000SAE1: {
    label: 'Consumer Price Index for All Urban Consumers: Education',
    shortLabel: 'CPI Education',
    category: 'inflation',
    unit: 'Index 1982-1984=100',
  },
  CUSR0000SEHA: {
    label: 'Consumer Price Index for All Urban Consumers: Rent of Primary Residence',
    shortLabel: 'CPI Rent',
    category: 'inflation',
    unit: 'Index 1982-1984=100',
  },
  CUUR0000SAT1: {
    label: 'Consumer Price Index for All Urban Consumers: Transportation',
    shortLabel: 'CPI Transportation',
    category: 'inflation',
    unit: 'Index 1982-1984=100',
  },
  DGS10: {
    label: '10-Year Treasury Constant Maturity Rate',
    shortLabel: '10-Year Treasury',
    category: 'rates',
    unit: 'Percent',
  },
  FEDFUNDS: {
    label: 'Federal Funds Effective Rate',
    shortLabel: 'Fed Funds Rate',
    category: 'rates',
    unit: 'Percent',
  },
  FIXHAI: {
    label: 'Housing Affordability Index (Fixed)',
    shortLabel: 'Housing Affordability',
    category: 'housing',
    unit: 'Index',
  },
  GDPC1: {
    label: 'Real Gross Domestic Product',
    shortLabel: 'Real GDP',
    category: 'macro',
    unit: 'Billions of Chained 2017 Dollars',
  },
  HOUST: {
    label: 'Housing Starts: Total: New Privately Owned Housing Units',
    shortLabel: 'Housing Starts',
    category: 'housing',
    unit: 'Thousands of Units',
  },
  MEHOINUSA672N: {
    label: 'Real Median Household Income in the United States',
    shortLabel: 'Median Household Income',
    category: 'income',
    unit: '2022 CPI-U-RS Adjusted Dollars',
  },
  MORTGAGE30US: {
    label: '30-Year Fixed Rate Mortgage Average in the United States',
    shortLabel: '30-Year Mortgage Rate',
    category: 'rates',
    unit: 'Percent',
  },
  MSPUS: {
    label: 'Median Sales Price of Houses Sold for the United States',
    shortLabel: 'Median Home Sale Price',
    category: 'housing',
    unit: 'Dollars',
  },
  NONREVSL: {
    label: 'Total Nonrevolving Credit Owned and Securitized',
    shortLabel: 'Non-Revolving Credit',
    category: 'credit',
    unit: 'Billions of Dollars',
  },
  PI: {
    label: 'Personal Income',
    shortLabel: 'Personal Income',
    category: 'income',
    unit: 'Billions of Dollars',
  },
  PSAVERT: {
    label: 'Personal Saving Rate',
    shortLabel: 'Savings Rate',
    category: 'income',
    unit: 'Percent',
  },
  REVOLSL: {
    label: 'Revolving Consumer Credit Owned and Securitized',
    shortLabel: 'Revolving Credit',
    category: 'credit',
    unit: 'Billions of Dollars',
  },
  SAVINGSL: {
    label: 'Savings Deposits at Commercial Banks (Discontinued)',
    shortLabel: 'Savings Deposits',
    category: 'credit',
    unit: 'Billions of Dollars',
  },
  SP500: {
    label: 'S&P 500',
    shortLabel: 'S&P 500',
    category: 'markets',
    unit: 'Index',
  },
  TDSP: {
    label: 'Household Debt Service Payments as a Percent of Disposable Personal Income',
    shortLabel: 'Debt Service Ratio',
    category: 'credit',
    unit: 'Percent',
  },
  TERMCBCCALLNS: {
    label: 'Interest Rates: Credit Cards: Terms of Credit: Interest Rate: All Accounts',
    shortLabel: 'Credit Card Rate',
    category: 'rates',
    unit: 'Percent',
  },
  TNWBSHNO: {
    label: 'Net Worth of Households and Nonprofit Organizations',
    shortLabel: 'Household Net Worth',
    category: 'wealth',
    unit: 'Billions of Dollars',
  },
  TOTALSL: {
    label: 'Total Consumer Credit Owned and Securitized',
    shortLabel: 'Total Consumer Credit',
    category: 'credit',
    unit: 'Billions of Dollars',
  },
  UNRATE: {
    label: 'Unemployment Rate',
    shortLabel: 'Unemployment Rate',
    category: 'macro',
    unit: 'Percent',
  },
  VIXCLS: {
    label: 'CBOE Volatility Index: VIX',
    shortLabel: 'VIX',
    category: 'markets',
    unit: 'Index',
  },
  WFRBST01134: {
    label: 'Share of Total Net Worth Held by the Top 1% (99th to 100th Wealth Percentiles)',
    shortLabel: 'Top 1% Wealth Share',
    category: 'wealth',
    unit: 'Percent',
  },
  WILL5000PR: {
    label: 'Wilshire 5000 Total Market Full Cap Price Index',
    shortLabel: 'Wilshire 5000',
    category: 'markets',
    unit: 'Index',
  },
};

// Helper: get human-readable label for a series ID
export function getSeriesLabel(id: string): string {
  return SERIES_REGISTRY[id]?.label ?? id;
}

// Helper: get all series IDs belonging to a category
export function getSeriesByCategory(category: string): string[] {
  return Object.entries(SERIES_REGISTRY)
    .filter(([, info]) => info.category === category)
    .map(([id]) => id);
}

// Curated groupings used by the calculator
export const INFLATION_SERIES: string[] = [
  'CPIAUCSL',
  'CPIENGSL',
  'CPIMEDSL',
  'CPIUFDSL',
  'CUSR0000SAE1',
  'CUSR0000SEHA',
  'CUUR0000SAT1',
];

export const INCOME_SERIES: string[] = [
  'A229RX0',
  'CES0500000003',
  'MEHOINUSA672N',
  'PI',
  'PSAVERT',
];

export const RATE_SERIES: string[] = [
  'DGS10',
  'FEDFUNDS',
  'MORTGAGE30US',
  'TERMCBCCALLNS',
];
