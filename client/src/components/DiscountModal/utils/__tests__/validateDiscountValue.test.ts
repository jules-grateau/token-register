import { validateDiscountValue } from '../validateDiscountValue';

const t = (key: string) => key;

describe('validateDiscountValue', () => {
  it('returns empty string for empty value', () => {
    expect(validateDiscountValue('', 'fixed', 20, t)).toBe('');
  });

  it('returns error for non-numeric value', () => {
    expect(validateDiscountValue('abc', 'fixed', 20, t)).toBe(
      'error_invalid_discount_value_positive'
    );
  });

  it('returns error for negative value', () => {
    expect(validateDiscountValue('-5', 'fixed', 20, t)).toBe(
      'error_invalid_discount_value_positive'
    );
  });

  it('returns error for fixed value greater than total price', () => {
    expect(validateDiscountValue('1000', 'fixed', 20, t)).toBe(
      'error_invalid_fixed_value_over_total_price'
    );
  });

  it('returns error for percentage value greater than 100', () => {
    expect(validateDiscountValue('150', 'percentage', 20, t)).toBe(
      'error_invalid_percentage_value_max_100'
    );
  });

  it('returns empty string for valid fixed value', () => {
    expect(validateDiscountValue('5', 'fixed', 20, t)).toBe('');
  });

  it('returns empty string for valid percentage value', () => {
    expect(validateDiscountValue('50', 'percentage', 20, t)).toBe('');
  });
});
