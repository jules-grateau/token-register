import {
  applyKeypadKey,
  cardPayment,
  cashPayment,
  computeChangeState,
  parseKeypadInput,
  splitCashPayment,
  suggestAmounts,
  toKeypadInput,
  type KeypadKey,
} from '../payment';

const typeKeys = (keys: string, allowDecimal = true) =>
  [...keys].reduce(
    (input, key) =>
      applyKeypadKey(input, (key === '<' ? 'backspace' : key) as KeypadKey, allowDecimal),
    ''
  );

describe('suggestAmounts (D-029, examples of docs/design/components.md)', () => {
  it.each([
    [80, 100, [100, 500, 1000, 2000]],
    [750, 100, [800, 1000, 2000, 5000]],
    [1200, 100, [1500, 2000, 5000, 10000]],
    [1850, 100, [1900, 2000, 5000, 10000]],
    [4700, 100, [5000, 6000, 7000, 10000]],
    [12000, 100, [12500, 13000, 14000, 15000]],
    [3, 1, [5, 10, 20, 50]],
  ])('total %i (unit %i) -> %j', (total, unit, expected) => {
    expect(suggestAmounts(total, unit)).toEqual(expected);
  });

  it('always returns 4 ascending amounts strictly above the total', () => {
    for (const total of [1, 99, 100, 500, 999, 5000, 9999, 25000, 999999]) {
      const amounts = suggestAmounts(total, 100);
      expect(amounts).toHaveLength(4);
      expect(amounts.every((amount) => amount > total)).toBe(true);
      expect([...amounts].sort((a, b) => a - b)).toEqual(amounts);
    }
  });
});

describe('keypad input', () => {
  it('builds an amount with a decimal separator', () => {
    expect(typeKeys('18,5')).toBe('18,5');
    expect(parseKeypadInput('18,5', 100)).toBe(1850);
    expect(parseKeypadInput('7,55', 100)).toBe(755);
  });

  it('ignores keys that break a rule', () => {
    expect(typeKeys('1,555')).toBe('1,55'); // 3rd decimal ignored (D-010)
    expect(typeKeys('1,2,3')).toBe('1,23'); // single separator
    expect(typeKeys('12345')).toBe('1234'); // 4 digits max before the separator
    expect(typeKeys('007')).toBe('7'); // no leading zeros
    expect(typeKeys(',5')).toBe('0,5');
    expect(typeKeys('1,5', false)).toBe('15'); // tokens: no separator (D-012)
  });

  it('deletes the last character', () => {
    expect(typeKeys('18,5<')).toBe('18,');
    expect(typeKeys('1<<')).toBe('');
  });

  it('treats an empty or zero input as no amount', () => {
    expect(parseKeypadInput('', 100)).toBeNull();
    expect(parseKeypadInput('0', 100)).toBeNull();
    expect(parseKeypadInput('0,', 100)).toBeNull();
    expect(parseKeypadInput('12', 1)).toBe(12);
  });

  it('turns a suggestion into keypad text', () => {
    expect(toKeypadInput(2000, 100)).toBe('20');
    expect(toKeypadInput(750, 100)).toBe('7,50');
    expect(toKeypadInput(10, 1)).toBe('10');
  });
});

describe('computeChangeState', () => {
  it('handles a total of 0 or below first (D-032)', () => {
    expect(computeChangeState(0, 500, 'EUR')).toEqual({ kind: 'nothing-due' });
    expect(computeChangeState(-200, null, 'EUR')).toEqual({ kind: 'refund', amount: 200 });
  });

  it('gives the change to return', () => {
    expect(computeChangeState(750, null, 'EUR')).toEqual({ kind: 'empty' });
    expect(computeChangeState(750, 2000, 'EUR')).toEqual({
      kind: 'change',
      received: 2000,
      change: 1250,
      large: false,
    });
    expect(computeChangeState(750, 750, 'EUR')).toEqual({ kind: 'no-change', received: 750 });
  });

  it('warns about a change above 100 EUR, in euros only', () => {
    expect(computeChangeState(500, 20000, 'EUR')).toMatchObject({ large: true });
    expect(computeChangeState(500, 10500, 'EUR')).toMatchObject({ large: false });
    expect(computeChangeState(5, 500, 'TOKEN')).toMatchObject({ large: false });
  });

  it('asks for the rest by card in euros, flags a missing amount in tokens', () => {
    expect(computeChangeState(750, 500, 'EUR')).toEqual({
      kind: 'remaining',
      received: 500,
      remaining: 250,
    });
    expect(computeChangeState(7, 5, 'TOKEN')).toEqual({ kind: 'missing', received: 5, missing: 2 });
  });
});

describe('recorded payment (D-031, D-034)', () => {
  it('records the whole total on a single mode', () => {
    expect(cardPayment(750)).toEqual({ cashAmount: null, cardAmount: 750 });
    expect(cashPayment(-200)).toEqual({ cashAmount: -200, cardAmount: null });
  });

  it('never records the change: cash covers at most the total', () => {
    expect(splitCashPayment(750, 2000)).toEqual({ cashAmount: 750, cardAmount: null });
    expect(splitCashPayment(750, 750)).toEqual({ cashAmount: 750, cardAmount: null });
  });

  it('splits a partial cash payment, the rest by card', () => {
    expect(splitCashPayment(750, 500)).toEqual({ cashAmount: 500, cardAmount: 250 });
  });
});
