import {
  addPart,
  applyCardKey,
  applyKeypadKey,
  cashSuggestions,
  completePayment,
  computeChangeState,
  NO_PARTS,
  parseKeypadInput,
  partOutcome,
  remainingDue,
  removePart,
  singleModePayment,
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

describe('cashSuggestions (D-053)', () => {
  it('puts the exact amount due first, then 3 amounts above it', () => {
    expect(cashSuggestions(750, 100)).toEqual([750, 800, 1000, 2000]);
    expect(cashSuggestions(1200, 100)).toEqual([1200, 1500, 2000, 5000]);
  });

  it('suggests from the amount still due after a card part', () => {
    expect(cashSuggestions(250, 100)).toEqual([250, 300, 500, 1000]);
  });

  it('suggests nothing when nothing is due', () => {
    expect(cashSuggestions(0, 100)).toEqual([]);
  });
});

describe('payment parts (D-053)', () => {
  const cash500 = addPart(NO_PARTS, 'cash', 500);

  it('deducts the added parts from the total, and removes a part', () => {
    expect(remainingDue(750, NO_PARTS)).toBe(750);
    expect(remainingDue(750, cash500)).toBe(250);
    expect(removePart(cash500, 'cash')).toEqual(NO_PARTS);
  });

  it('never lets the card amount go above the amount due', () => {
    expect(applyCardKey('', '5', 750, 100)).toBe('5');
    expect(applyCardKey('7', ',', 750, 100)).toBe('7,');
    expect(applyCardKey('7,', '6', 750, 100)).toBe('7,'); // 7,6 > 7,50: ignored
    expect(applyCardKey('7', '5', 750, 100)).toBe('7'); // 75 > 7,50: ignored
    expect(applyCardKey('7,5', 'backspace', 750, 100)).toBe('7,');
  });

  it('completes the sale when the part covers the amount due', () => {
    expect(partOutcome('card', 750, 750, NO_PARTS)).toBe('complete');
    expect(partOutcome('cash', 2000, 750, NO_PARTS)).toBe('complete');
    expect(partOutcome('cash', 750, 750, NO_PARTS)).toBe('complete');
    expect(partOutcome('card', 250, 250, cash500)).toBe('complete');
  });

  it('adds a part below the amount due, unless it is the last mode', () => {
    expect(partOutcome('cash', 500, 750, NO_PARTS)).toBe('add');
    expect(partOutcome('card', 300, 750, NO_PARTS)).toBe('add');
    // The other mode already has its part: no third part.
    expect(partOutcome('card', 100, 250, cash500)).toBe('none');
    expect(partOutcome('cash', null, 750, NO_PARTS)).toBe('none');
  });

  it('records the cash kept, never the change (D-034)', () => {
    expect(completePayment(NO_PARTS, 'cash', 2000, 750)).toEqual({
      cashAmount: 750,
      cardAmount: null,
    });
    expect(completePayment(NO_PARTS, 'card', 750, 750)).toEqual({
      cashAmount: null,
      cardAmount: 750,
    });
    expect(completePayment(cash500, 'card', 250, 250)).toEqual({
      cashAmount: 500,
      cardAmount: 250,
    });
    const card300 = addPart(NO_PARTS, 'card', 300);
    expect(completePayment(card300, 'cash', 1000, 450)).toEqual({
      cashAmount: 450,
      cardAmount: 300,
    });
  });

  it('records the whole total on the mode chosen for a total <= 0', () => {
    expect(singleModePayment('cash', -200)).toEqual({ cashAmount: -200, cardAmount: null });
    expect(singleModePayment('card', 0)).toEqual({ cashAmount: null, cardAmount: 0 });
  });
});

describe('computeChangeState', () => {
  it('handles a total of 0 or below first', () => {
    expect(computeChangeState(0, NO_PARTS, 'cash', 500)).toEqual({ kind: 'nothing-due' });
    expect(computeChangeState(-200, NO_PARTS, null, null)).toEqual({ kind: 'refund', amount: 200 });
  });

  it('asks for a mode, then an amount', () => {
    expect(computeChangeState(750, NO_PARTS, null, null)).toEqual({ kind: 'empty', hint: 'mode' });
    expect(computeChangeState(750, NO_PARTS, 'cash', null)).toEqual({
      kind: 'empty',
      hint: 'cash',
    });
    expect(computeChangeState(750, addPart(NO_PARTS, 'cash', 500), null, null)).toEqual({
      kind: 'due',
      remaining: 250,
    });
  });

  it('gives the change to return on the cash part', () => {
    expect(computeChangeState(750, NO_PARTS, 'cash', 2000)).toEqual({
      kind: 'change',
      received: 2000,
      change: 1250,
      large: false,
    });
    expect(computeChangeState(750, NO_PARTS, 'cash', 750)).toEqual({
      kind: 'no-change',
      received: 750,
    });
    const card300 = addPart(NO_PARTS, 'card', 300);
    expect(computeChangeState(750, card300, 'cash', 500)).toMatchObject({ change: 50 });
  });

  it('warns about a change above 100 EUR', () => {
    expect(computeChangeState(500, NO_PARTS, 'cash', 20000)).toMatchObject({ large: true });
    expect(computeChangeState(500, NO_PARTS, 'cash', 10500)).toMatchObject({ large: false });
  });

  it('shows a full card payment and what remains after a part', () => {
    expect(computeChangeState(750, NO_PARTS, 'card', 750)).toEqual({ kind: 'paid', amount: 750 });
    expect(computeChangeState(750, NO_PARTS, 'cash', 500)).toEqual({
      kind: 'remaining',
      mode: 'cash',
      amount: 500,
      remaining: 250,
      last: false,
    });
    expect(computeChangeState(750, addPart(NO_PARTS, 'cash', 500), 'card', 100)).toMatchObject({
      kind: 'remaining',
      last: true,
    });
  });
});
