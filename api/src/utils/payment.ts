import type { CurrencyCode, OrderPaymentType } from 'shared-ts';
import { ValidationError } from '../types/errors';
import { isValidStoredAmount } from './currency';

export const PAYMENT_REQUIRED_MESSAGE =
  'Payment is required. Reload the page to use the latest version of the app.';

const isNullableAmount = (value: unknown): value is number | null =>
  value === null || isValidStoredAmount(value);

/**
 * Checks the payment sent with a new order against the total computed by the server
 * (D-030 to D-034). Returns the payment to store, or null when nothing is stored.
 *
 * - Token instances record no payment (D-033): a payment is refused.
 * - EUR instances refuse an order without payment (D-035), including the bare-array body of
 *   clients older than 1.3.0: the code PAYMENT_REQUIRED asks the client to reload the page.
 * - EUR instances (D-030, D-034): at least one mode; amounts in whole cents.
 *   - total > 0: every given mode is > 0 and cash + card = total (mixed payment, D-031);
 *   - total <= 0: a single mode, whose amount is the total (D-032).
 */
export function validateOrderPayment(
  payment: unknown,
  total: number,
  currency: CurrencyCode
): OrderPaymentType | null {
  if (currency === 'TOKEN') {
    if (payment !== undefined && payment !== null) {
      throw new ValidationError('Payments are not recorded on token instances');
    }
    return null;
  }

  if (payment === undefined || payment === null || typeof payment !== 'object') {
    throw new ValidationError(PAYMENT_REQUIRED_MESSAGE, 'PAYMENT_REQUIRED');
  }

  const { cashAmount = null, cardAmount = null } = payment as Partial<OrderPaymentType>;
  if (!isNullableAmount(cashAmount) || !isNullableAmount(cardAmount)) {
    throw new ValidationError('Invalid payment amount');
  }

  const modes = [cashAmount, cardAmount].filter((amount): amount is number => amount !== null);
  if (modes.length === 0) {
    throw new ValidationError(PAYMENT_REQUIRED_MESSAGE, 'PAYMENT_REQUIRED');
  }

  if (total <= 0) {
    if (modes.length !== 1 || modes[0] !== total) {
      throw new ValidationError('Invalid payment: a single mode must cover the total');
    }
  } else {
    const sum = modes.reduce((acc, amount) => acc + amount, 0);
    if (modes.some((amount) => amount <= 0) || sum !== total) {
      throw new ValidationError('Invalid payment: amounts must add up to the order total');
    }
  }

  return { cashAmount, cardAmount };
}
