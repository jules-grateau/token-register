import type { CurrencyCode, OrderPaymentType } from 'shared-ts';

// Payment help of the "Encaissement" modal (docs/design/components.md, D-028 to D-034).
// Amounts are stored integers: cents in EUR, tokens otherwise.

/** Stored units per displayed unit: 100 cents per euro, 1 per token. */
export function getPaymentUnit(currency: CurrencyCode): number {
  return currency === 'EUR' ? 100 : 1;
}

const SUGGESTION_STEPS = [5, 10, 20, 50, 100];
const SUGGESTION_COUNT = 4;

/** Smallest multiple of `step` strictly greater than `total`. */
const nextMultiple = (total: number, step: number) => (Math.floor(total / step) + 1) * step;

/**
 * Amounts suggested for a total > 0 (D-029): always 4 amounts, ascending, all strictly above
 * the total (the exact amount is the "Appoint" button). `unit` = 100 in EUR, 1 in tokens.
 */
export function suggestAmounts(total: number, unit: number): number[] {
  const candidates = new Set<number>();
  if (total % unit !== 0) {
    candidates.add(nextMultiple(total, unit)); // next whole euro
  }
  for (const step of SUGGESTION_STEPS) {
    candidates.add(nextMultiple(total, step * unit));
  }

  let ten = nextMultiple(total, 10 * unit);
  while (candidates.size < SUGGESTION_COUNT) {
    if (!candidates.has(ten)) candidates.add(ten);
    ten += 10 * unit;
  }

  return [...candidates].sort((a, b) => a - b).slice(0, SUGGESTION_COUNT);
}

// --- Keypad input ------------------------------------------------------------------------

export type KeypadKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | ','
  | 'backspace';

const MAX_INTEGER_DIGITS = 4; // 9 999,99 EUR or 9 999 tokens
const MAX_DECIMALS = 2; // D-010

/**
 * Applies a key to the typed text ("18,5"). A key that would break a rule has no effect:
 * 4 digits before the separator, 2 after (D-010), a single separator, none in tokens (D-012),
 * "," first gives "0,", no leading zeros.
 */
export function applyKeypadKey(input: string, key: KeypadKey, allowDecimal: boolean): string {
  if (key === 'backspace') return input.slice(0, -1);

  const [integerPart, decimalPart] = input.split(',');
  if (key === ',') {
    if (!allowDecimal || decimalPart !== undefined) return input;
    return input === '' ? '0,' : `${input},`;
  }

  if (decimalPart !== undefined) {
    return decimalPart.length >= MAX_DECIMALS ? input : input + key;
  }
  if (integerPart === '0') return key; // no leading zero ("0" then "5" -> "5")
  if (integerPart.length >= MAX_INTEGER_DIGITS) return input;
  return input + key;
}

/** Typed text to a stored amount ("18,5" -> 1850 in EUR). null when empty or zero. */
export function parseKeypadInput(input: string, unit: number): number | null {
  if (input === '') return null;
  const [integerPart, decimalPart = ''] = input.split(',');
  const cents = unit === 100 ? Number(decimalPart.padEnd(2, '0').slice(0, 2)) : 0;
  const amount = Number(integerPart || '0') * unit + cents;
  return amount > 0 ? amount : null;
}

/** Stored amount to the keypad text (2000 -> "20"), used when a suggestion is touched. */
export function toKeypadInput(amount: number, unit: number): string {
  const integerPart = Math.floor(amount / unit);
  const rest = amount % unit;
  return rest === 0 ? String(integerPart) : `${integerPart},${String(rest).padStart(2, '0')}`;
}

// --- Change state ------------------------------------------------------------------------

/** Above this change (100 EUR), a non-blocking warning asks to check the amount received. */
export const LARGE_CHANGE_THRESHOLD = 10000;

export type ChangeState =
  | { kind: 'empty' }
  | { kind: 'change'; received: number; change: number; large: boolean }
  | { kind: 'no-change'; received: number }
  | { kind: 'remaining'; received: number; remaining: number } // EUR: rest paid by card
  | { kind: 'missing'; received: number; missing: number } // tokens: not enough
  | { kind: 'refund'; amount: number } // total < 0
  | { kind: 'nothing-due' }; // total = 0

export function computeChangeState(
  total: number,
  received: number | null,
  currency: CurrencyCode
): ChangeState {
  if (total === 0) return { kind: 'nothing-due' };
  if (total < 0) return { kind: 'refund', amount: -total };
  if (received === null) return { kind: 'empty' };
  if (received > total) {
    const change = received - total;
    return {
      kind: 'change',
      received,
      change,
      large: currency === 'EUR' && change > LARGE_CHANGE_THRESHOLD,
    };
  }
  if (received === total) return { kind: 'no-change', received };
  return currency === 'EUR'
    ? { kind: 'remaining', received, remaining: total - received }
    : { kind: 'missing', received, missing: total - received };
}

// --- What is recorded (EUR only, D-034) --------------------------------------------------

export const cardPayment = (total: number): OrderPaymentType => ({
  cashAmount: null,
  cardAmount: total,
});

export const cashPayment = (total: number): OrderPaymentType => ({
  cashAmount: total,
  cardAmount: null,
});

/**
 * Cash received for a total > 0 (D-031): the change is never recorded, so cash covers at most
 * the total; below the total, the rest is paid by card.
 */
export function splitCashPayment(total: number, received: number): OrderPaymentType {
  if (received >= total) return cashPayment(total);
  return { cashAmount: received, cardAmount: total - received };
}
