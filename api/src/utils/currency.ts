import type { CurrencyCode } from 'shared-ts';

export const DEFAULT_CURRENCY: CurrencyCode = 'TOKEN';

/** Number of stored units per displayed unit: 1 token = 1, 1 euro = 100 cents. */
const UNITS_PER_MAJOR: Record<CurrencyCode, number> = {
  TOKEN: 1,
  EUR: 100,
};

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === 'TOKEN' || value === 'EUR';
}

/**
 * Currency configured for this instance (D-008): `CURRENCY` env var, `TOKEN` when unset.
 * Throws on an unknown value so that a typo never silently falls back to tokens.
 */
export function getConfiguredCurrency(env: NodeJS.ProcessEnv = process.env): CurrencyCode {
  const raw = env.CURRENCY?.trim();
  if (!raw) return DEFAULT_CURRENCY;
  const value = raw.toUpperCase();
  if (!isCurrencyCode(value)) {
    throw new Error(`Invalid CURRENCY "${raw}". Allowed values: TOKEN, EUR.`);
  }
  return value;
}

/** Amounts are stored as integers in the smallest unit of the currency (D-010, D-012). */
export function isValidStoredAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

/**
 * Converts a stored amount 1 for 1 between currencies (D-009):
 * - TOKEN -> EUR: 3 tokens -> 3,00 EUR (300 cents);
 * - EUR -> TOKEN: rounded to the nearest token, .5 rounded away from zero
 *   (150 -> 2, 149 -> 1, -150 -> -2, -149 -> -1).
 */
export function convertAmount(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  const fromUnits = UNITS_PER_MAJOR[from];
  const toUnits = UNITS_PER_MAJOR[to];

  if (toUnits >= fromUnits) {
    return amount * (toUnits / fromUnits);
  }

  const ratio = fromUnits / toUnits;
  const sign = amount < 0 ? -1 : 1;
  // Integer arithmetic to avoid floating point surprises on .5 values.
  const converted = sign * Math.floor((Math.abs(amount) + ratio / 2) / ratio);
  return converted === 0 ? 0 : converted; // avoid -0
}
