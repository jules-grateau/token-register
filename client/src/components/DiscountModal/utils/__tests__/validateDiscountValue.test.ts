import { validateDiscountValue } from '../validateDiscountValue';

const t = (key: string) => key;

describe('validateDiscountValue (tokens)', () => {
  it('returns empty string for empty value', () => {
    expect(validateDiscountValue('', 'fixed', 20, 'TOKEN', t)).toBe('');
  });

  it('returns error for non-numeric value', () => {
    expect(validateDiscountValue('abc', 'fixed', 20, 'TOKEN', t)).toBe(
      'error_invalid_discount_value_positive'
    );
  });

  it('returns error for negative value', () => {
    expect(validateDiscountValue(-5, 'fixed', 20, 'TOKEN', t)).toBe(
      'error_invalid_discount_value_positive'
    );
  });

  it('returns error for fixed value greater than total price', () => {
    expect(validateDiscountValue(1000, 'fixed', 20, 'TOKEN', t)).toBe(
      'error_invalid_fixed_value_over_total_price'
    );
  });

  it('refuses fractional tokens (D-012)', () => {
    expect(validateDiscountValue(1.5, 'fixed', 20, 'TOKEN', t)).toBe('errors.whole_tokens');
  });

  it('returns error for percentage value greater than 100', () => {
    expect(validateDiscountValue(150, 'percentage', 20, 'TOKEN', t)).toBe(
      'error_invalid_percentage_value_max_100'
    );
  });

  it('refuses a non integer percentage', () => {
    expect(validateDiscountValue(12.5, 'percentage', 20, 'TOKEN', t)).toBe(
      'error_invalid_discount_value_positive'
    );
  });

  it('returns empty string for valid fixed value', () => {
    expect(validateDiscountValue(5, 'fixed', 20, 'TOKEN', t)).toBe('');
  });

  it('returns empty string for valid percentage value', () => {
    expect(validateDiscountValue(50, 'percentage', 20, 'TOKEN', t)).toBe('');
  });

  it('refuses any discount on a negative price (deposit return)', () => {
    expect(validateDiscountValue(1, 'fixed', -1, 'TOKEN', t)).toBe(
      'error_invalid_discount_value_positive'
    );
  });
});

describe('validateDiscountValue (euros, total in cents)', () => {
  it('accepts cents, with a comma or a dot (D-010)', () => {
    expect(validateDiscountValue(0.5, 'fixed', 250, 'EUR', t)).toBe('');
    expect(validateDiscountValue('0,50', 'fixed', 250, 'EUR', t)).toBe('');
    expect(validateDiscountValue('0.5', 'fixed', 250, 'EUR', t)).toBe('');
  });

  it('refuses more than 2 decimals instead of rounding', () => {
    expect(validateDiscountValue('1,555', 'fixed', 250, 'EUR', t)).toBe('errors.max_two_decimals');
  });

  it('compares the discount with the total in cents', () => {
    expect(validateDiscountValue(2.5, 'fixed', 250, 'EUR', t)).toBe('');
    expect(validateDiscountValue(2.51, 'fixed', 250, 'EUR', t)).toBe(
      'error_invalid_fixed_value_over_total_price'
    );
  });
});
