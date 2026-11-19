import { convertAmount, getConfiguredCurrency, isValidStoredAmount } from '../currency';

describe('getConfiguredCurrency', () => {
  it('defaults to TOKEN when CURRENCY is not set', () => {
    expect(getConfiguredCurrency({})).toBe('TOKEN');
    expect(getConfiguredCurrency({ CURRENCY: '  ' })).toBe('TOKEN');
  });

  it('reads EUR and TOKEN, case-insensitively', () => {
    expect(getConfiguredCurrency({ CURRENCY: 'EUR' })).toBe('EUR');
    expect(getConfiguredCurrency({ CURRENCY: 'eur' })).toBe('EUR');
    expect(getConfiguredCurrency({ CURRENCY: 'TOKEN' })).toBe('TOKEN');
  });

  it('throws on an unknown value instead of falling back silently', () => {
    expect(() => getConfiguredCurrency({ CURRENCY: 'USD' })).toThrow('Invalid CURRENCY');
  });
});

describe('isValidStoredAmount', () => {
  it('accepts whole numbers, including negative ones', () => {
    expect(isValidStoredAmount(0)).toBe(true);
    expect(isValidStoredAmount(150)).toBe(true);
    expect(isValidStoredAmount(-100)).toBe(true);
  });

  it('rejects decimals and non numbers', () => {
    expect(isValidStoredAmount(1.5)).toBe(false);
    expect(isValidStoredAmount(155.5)).toBe(false);
    expect(isValidStoredAmount('150')).toBe(false);
    expect(isValidStoredAmount(NaN)).toBe(false);
  });
});

describe('convertAmount (D-009)', () => {
  it('keeps the amount when the currency does not change', () => {
    expect(convertAmount(150, 'EUR', 'EUR')).toBe(150);
    expect(convertAmount(3, 'TOKEN', 'TOKEN')).toBe(3);
  });

  it('converts tokens to euros 1 for 1', () => {
    expect(convertAmount(3, 'TOKEN', 'EUR')).toBe(300);
    expect(convertAmount(-1, 'TOKEN', 'EUR')).toBe(-100);
    expect(convertAmount(0, 'TOKEN', 'EUR')).toBe(0);
  });

  it('converts euros to the nearest token', () => {
    expect(convertAmount(300, 'EUR', 'TOKEN')).toBe(3);
    expect(convertAmount(149, 'EUR', 'TOKEN')).toBe(1);
    expect(convertAmount(151, 'EUR', 'TOKEN')).toBe(2);
    expect(convertAmount(49, 'EUR', 'TOKEN')).toBe(0);
  });

  it('rounds .5 up in absolute value', () => {
    expect(convertAmount(150, 'EUR', 'TOKEN')).toBe(2);
    expect(convertAmount(250, 'EUR', 'TOKEN')).toBe(3);
    expect(convertAmount(50, 'EUR', 'TOKEN')).toBe(1);
  });

  it('rounds negative prices symmetrically (deposit return)', () => {
    expect(convertAmount(-100, 'EUR', 'TOKEN')).toBe(-1);
    expect(convertAmount(-149, 'EUR', 'TOKEN')).toBe(-1);
    expect(convertAmount(-150, 'EUR', 'TOKEN')).toBe(-2);
    expect(Object.is(convertAmount(-49, 'EUR', 'TOKEN'), 0)).toBe(true);
  });
});
