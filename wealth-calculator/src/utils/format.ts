/**
 * Format as currency.
 * Values >= 1,000,000 use M suffix: "$1.2M"
 * Values >= 1,000 use comma separator: "$1,234"
 * Values < 1,000: "$123"
 */
export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return '€' + (value / 1_000_000).toFixed(1) + 'M';
  }
  return '€' + Math.round(value).toLocaleString('en-US');
}

/**
 * Format as percentage.
 * 0.072 -> "7.2%"
 * Defaults to 1 decimal place.
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Format compact number.
 * 1_234_567 -> "1.2M"
 * 45_000 -> "45K"
 * < 1_000 -> "123"
 */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1_000) {
    return Math.round(value / 1_000) + 'K';
  }
  return String(Math.round(value));
}
