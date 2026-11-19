import {
  computePercentageDiscount,
  formatAmount,
  fromStoredAmount,
  getDecimalScale,
  hasValidPrecision,
  parseAmountInput,
  toStoredAmount,
} from '../currency';

// Intl uses non-breaking spaces: U+202F (thousands) and U+00A0 (before the symbol).
const normalizeSpaces = (s: string) => s.replace(/\s/g, ' ');
const NBSP = String.fromCharCode(0x00a0);
const tokenLabel = (count: number) => (Math.abs(count) > 1 ? 'Jetons' : 'Jeton');

describe('formatAmount', () => {
  it('formats euros in French, cents always shown (D-011)', () => {
    expect(normalizeSpaces(formatAmount(150, 'EUR', tokenLabel))).toBe('1,50 €');
    expect(normalizeSpaces(formatAmount(200, 'EUR', tokenLabel))).toBe('2,00 €');
    expect(normalizeSpaces(formatAmount(0, 'EUR', tokenLabel))).toBe('0,00 €');
    expect(normalizeSpaces(formatAmount(123456, 'EUR', tokenLabel))).toBe('1 234,56 €');
  });

  it('formats negative euros (deposit return)', () => {
    expect(normalizeSpaces(formatAmount(-100, 'EUR', tokenLabel))).toBe('-1,00 €');
  });

  it('uses a non-breaking space before the euro sign', () => {
    expect(formatAmount(150, 'EUR', tokenLabel)).toBe(`1,50${NBSP}€`);
  });

  it('stays in French format even when the interface is in English', () => {
    const navigatorLanguage = jest.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    document.documentElement.lang = 'en';

    expect(normalizeSpaces(formatAmount(150, 'EUR', tokenLabel))).toBe('1,50 €');

    navigatorLanguage.mockRestore();
    document.documentElement.lang = '';
  });

  it('keeps the translated token label for tokens', () => {
    expect(formatAmount(3, 'TOKEN', tokenLabel)).toBe('3 Jetons');
    expect(formatAmount(1, 'TOKEN', tokenLabel)).toBe('1 Jeton');
    expect(formatAmount(-1, 'TOKEN', tokenLabel)).toBe('-1 Jeton');
  });
});

describe('stored amount conversions', () => {
  it('converts typed euros to cents without float errors', () => {
    expect(toStoredAmount(1.5, 'EUR')).toBe(150);
    expect(toStoredAmount(1.15, 'EUR')).toBe(115);
    expect(toStoredAmount(-1, 'EUR')).toBe(-100);
    expect(toStoredAmount(3, 'TOKEN')).toBe(3);
  });

  it('converts stored amounts back to typed values', () => {
    expect(fromStoredAmount(150, 'EUR')).toBe(1.5);
    expect(fromStoredAmount(3, 'TOKEN')).toBe(3);
  });

  it('gives the number of decimals allowed per currency', () => {
    expect(getDecimalScale('EUR')).toBe(2);
    expect(getDecimalScale('TOKEN')).toBe(0);
  });

  it('checks precision: cents in EUR, whole tokens otherwise', () => {
    expect(hasValidPrecision(1.5, 'EUR')).toBe(true);
    expect(hasValidPrecision(1.15, 'EUR')).toBe(true);
    expect(hasValidPrecision(-1.99, 'EUR')).toBe(true);
    expect(hasValidPrecision(1.555, 'EUR')).toBe(false);
    expect(hasValidPrecision(2, 'TOKEN')).toBe(true);
    expect(hasValidPrecision(1.5, 'TOKEN')).toBe(false);
    expect(hasValidPrecision(NaN, 'TOKEN')).toBe(false);
  });

  it('parses typed values with a comma or a dot', () => {
    expect(parseAmountInput('1,50')).toBe(1.5);
    expect(parseAmountInput('1.50')).toBe(1.5);
    expect(parseAmountInput(2)).toBe(2);
    expect(parseAmountInput('')).toBeNaN();
  });
});

describe('computePercentageDiscount (D-010)', () => {
  it('rounds up to the next cent, in favour of the customer', () => {
    expect(computePercentageDiscount(250, 15)).toBe(38); // 0,375 € -> 0,38 €
    expect(computePercentageDiscount(250, 10)).toBe(25);
    expect(computePercentageDiscount(199, 33)).toBe(66); // 0,6567 € -> 0,66 €
  });

  it('rounds up to the next token as before', () => {
    expect(computePercentageDiscount(3, 50)).toBe(2);
    expect(computePercentageDiscount(10, 100)).toBe(10);
  });
});
