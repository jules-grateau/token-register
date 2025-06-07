import { DiscountType } from '../index';

export function validateDiscountValue(
  discountValue: string,
  discountType: DiscountType,
  originalTotalItemPrice: number,
  t: (key: string) => string
): string {
  if (!discountValue) return '';

  const value = parseInt(discountValue);

  if (isNaN(value) || value <= 0 || originalTotalItemPrice < 0) {
    return t('error_invalid_discount_value_positive');
  }

  if (discountType === 'fixed' && value > originalTotalItemPrice) {
    return t('error_invalid_fixed_value_over_total_price');
  }

  if (discountType === 'percentage' && value > 100) {
    return t('error_invalid_percentage_value_max_100');
  }

  return '';
}
