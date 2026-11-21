import type { CurrencyCode, OrderPaymentType } from 'shared-ts';

// Payment of the "Encaissement" modal (docs/design/components.md, D-053, D-034).
// Amounts are stored integers: cents in EUR, tokens otherwise. Token instances have no
// payment help (D-053): the keypad and the parts are used in euros only.

/** Stored units per displayed unit: 100 cents per euro, 1 per token. */
export function getPaymentUnit(currency: CurrencyCode): number {
  return currency === 'EUR' ? 100 : 1;
}

const SUGGESTION_STEPS = [5, 10, 20, 50, 100];
const SUGGESTION_COUNT = 4;

/** Smallest multiple of `step` strictly greater than `total`. */
const nextMultiple = (total: number, step: number) => (Math.floor(total / step) + 1) * step;

/**
 * 4 amounts, ascending, all strictly above the total (D-029); `cashSuggestions` puts the
 * exact amount in front of the first 3. `unit` = 100 in EUR, 1 in tokens.
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

// --- Payment parts (D-053) ---------------------------------------------------------------

export type PaymentMode = 'cash' | 'card';

/**
 * Parts already added, at most one per mode. An added part never covers the amount due (the
 * part that does saves the sale at once), so it is exactly what is recorded for its mode.
 */
export interface PaymentParts {
  cash: number | null;
  card: number | null;
}

export const NO_PARTS: PaymentParts = { cash: null, card: null };

export const hasParts = (parts: PaymentParts) => parts.cash !== null || parts.card !== null;

/** Amount still due once the added parts are deducted. */
export const remainingDue = (total: number, parts: PaymentParts) =>
  total - (parts.cash ?? 0) - (parts.card ?? 0);

export const otherMode = (mode: PaymentMode): PaymentMode => (mode === 'cash' ? 'card' : 'cash');

/** The other mode already has a part: this one must cover the amount due (no third part). */
export const isLastMode = (mode: PaymentMode, parts: PaymentParts) =>
  parts[otherMode(mode)] !== null;

/** Cash buttons (D-053): the exact amount due first, then the 3 smallest amounts above it. */
export function cashSuggestions(due: number, unit: number): number[] {
  if (due <= 0) return [];
  return [due, ...suggestAmounts(due, unit).slice(0, SUGGESTION_COUNT - 1)];
}

/** Card keypad (D-053): a key that would take the card amount above the amount due is ignored. */
export function applyCardKey(input: string, key: KeypadKey, due: number, unit: number): string {
  const next = applyKeypadKey(input, key, unit !== 1);
  const amount = parseKeypadInput(next, unit);
  return amount !== null && amount > due ? input : next;
}

/** What the amount typed for a mode leads to: save the sale, add a part, or nothing yet. */
export type PartOutcome = 'complete' | 'add' | 'none';

export function partOutcome(
  mode: PaymentMode,
  amount: number | null,
  due: number,
  parts: PaymentParts
): PartOutcome {
  if (amount === null || amount <= 0) return 'none';
  if (amount >= due) return mode === 'cash' || amount === due ? 'complete' : 'none';
  return isLastMode(mode, parts) ? 'none' : 'add';
}

export const addPart = (parts: PaymentParts, mode: PaymentMode, amount: number): PaymentParts => ({
  ...parts,
  [mode]: amount,
});

export const removePart = (parts: PaymentParts, mode: PaymentMode): PaymentParts => ({
  ...parts,
  [mode]: null,
});

/**
 * Payment recorded when the last part covers the amount due (D-034): the change is never
 * recorded, so the cash part covers at most what was due.
 */
export function completePayment(
  parts: PaymentParts,
  mode: PaymentMode,
  amount: number,
  due: number
): OrderPaymentType {
  const final = addPart(parts, mode, Math.min(amount, due));
  return { cashAmount: final.cash, cardAmount: final.card };
}

// --- Change state ------------------------------------------------------------------------

/** Above this change (100 EUR), a non-blocking warning asks to check the amount received. */
export const LARGE_CHANGE_THRESHOLD = 10000;

export type ChangeState =
  | { kind: 'empty'; hint: 'mode' | PaymentMode } // nothing chosen or typed yet
  | { kind: 'due'; remaining: number } // parts added, nothing typed
  | { kind: 'change'; received: number; change: number; large: boolean } // cash > due
  | { kind: 'no-change'; received: number } // cash = due
  | { kind: 'paid'; amount: number } // card = due
  // part < due; `last`: the other mode already has its part, so this one must cover it
  | { kind: 'remaining'; mode: PaymentMode; amount: number; remaining: number; last: boolean }
  | { kind: 'refund'; amount: number } // total < 0
  | { kind: 'nothing-due' }; // total = 0

export function computeChangeState(
  total: number,
  parts: PaymentParts,
  mode: PaymentMode | null,
  amount: number | null
): ChangeState {
  if (total === 0) return { kind: 'nothing-due' };
  if (total < 0) return { kind: 'refund', amount: -total };
  const due = remainingDue(total, parts);
  if (mode === null || amount === null) {
    return hasParts(parts)
      ? { kind: 'due', remaining: due }
      : { kind: 'empty', hint: mode ?? 'mode' };
  }
  if (amount < due) {
    const last = isLastMode(mode, parts);
    return { kind: 'remaining', mode, amount, remaining: due - amount, last };
  }
  if (mode === 'card') return { kind: 'paid', amount };
  if (amount === due) return { kind: 'no-change', received: amount };
  const change = amount - due;
  return { kind: 'change', received: amount, change, large: change > LARGE_CHANGE_THRESHOLD };
}

// --- Single mode, total <= 0 (EUR only, D-053, D-034) ------------------------------------

export const singleModePayment = (mode: PaymentMode, total: number): OrderPaymentType => ({
  cashAmount: mode === 'cash' ? total : null,
  cardAmount: mode === 'card' ? total : null,
});
