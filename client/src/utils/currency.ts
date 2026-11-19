import type { CurrencyCode } from 'shared-ts';

// Amounts are stored as integers in the smallest unit: 1 token, or 1 cent for EUR.

/** D-011: always the French format, whatever the interface language: "1,50 €", "-1,00 €". */
const EUR_FORMAT = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const UNITS_PER_MAJOR: Record<CurrencyCode, number> = { TOKEN: 1, EUR: 100 };

/** Decimals accepted when typing an amount (D-010, D-012). */
export function getDecimalScale(currency: CurrencyCode): number {
  return currency === 'EUR' ? 2 : 0;
}

/**
 * Formats a stored amount. Tokens keep the translated label ("3 Jetons", D-011),
 * which the caller provides because it depends on i18n.
 */
export function formatAmount(
  amount: number,
  currency: CurrencyCode,
  tokenLabel: (count: number) => string
): string {
  if (currency === 'EUR') {
    return EUR_FORMAT.format(amount / UNITS_PER_MAJOR.EUR);
  }
  return `${amount} ${tokenLabel(amount)}`;
}

/** Typed value ("1,50" -> 1.5) to stored amount (150). Assumes hasValidPrecision. */
export function toStoredAmount(value: number, currency: CurrencyCode): number {
  return Math.round(value * UNITS_PER_MAJOR[currency]);
}

/** Stored amount (150) to the value shown in an input (1.5). */
export function fromStoredAmount(amount: number, currency: CurrencyCode): number {
  return amount / UNITS_PER_MAJOR[currency];
}

/** True if the typed value fits the currency: whole tokens, or at most 2 decimals in EUR. */
export function hasValidPrecision(value: number, currency: CurrencyCode): boolean {
  if (!Number.isFinite(value)) return false;
  const scaled = value * UNITS_PER_MAJOR[currency];
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

/**
 * Percentage discount on a stored total, rounded up to the next unit in favour of the
 * customer: next token, or next cent in EUR (D-010).
 */
export function computePercentageDiscount(total: number, percentage: number): number {
  return Math.ceil((total * percentage) / 100);
}

/** NumberInput values come as numbers, or as strings while typing ("", "1,"). NaN if empty. */
export function parseAmountInput(value: number | string): number {
  if (typeof value === 'number') return value;
  const normalized = value.trim().replace(',', '.');
  return normalized === '' ? NaN : Number(normalized);
}
