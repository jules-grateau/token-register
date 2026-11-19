import type { CurrencyCode } from 'shared-ts';
import type { DiscountType } from '../index';
import { hasValidPrecision, parseAmountInput, toStoredAmount } from '../../../utils/currency';

/**
 * @param originalTotalItemPrice stored amount (tokens, or cents in EUR)
 * @param discountValue typed value: "0,50" EUR, 2 tokens, or a 1-100 percentage
 */
export function validateDiscountValue(
  discountValue: number | string,
  discountType: DiscountType,
  originalTotalItemPrice: number,
  currency: CurrencyCode,
  t: (key: string) => string
): string {
  if (discountValue === '') return '';

  const value = parseAmountInput(discountValue);

  if (isNaN(value) || value <= 0 || originalTotalItemPrice < 0) {
    return t('error_invalid_discount_value_positive');
  }

  if (discountType === 'percentage') {
    if (!Number.isInteger(value)) return t('error_invalid_discount_value_positive');
    if (value > 100) return t('error_invalid_percentage_value_max_100');
    return '';
  }

  // D-010: 2 decimals max in EUR, whole tokens otherwise. Refused, never rounded silently.
  if (!hasValidPrecision(value, currency)) {
    return t(currency === 'EUR' ? 'errors.max_two_decimals' : 'errors.whole_tokens');
  }

  if (toStoredAmount(value, currency) > originalTotalItemPrice) {
    return t('error_invalid_fixed_value_over_total_price');
  }

  return '';
}
