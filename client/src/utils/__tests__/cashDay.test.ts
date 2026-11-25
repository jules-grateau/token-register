import type { CashDayType } from 'shared-ts';
import { formatDayRange, isOpenedBeforeToday, shownSummary } from '../cashDay';

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute).getTime();

const closedDay = (openedAt: number, closedAt: number): CashDayType => ({
  id: 1,
  openedAt,
  closedAt,
  summary: { total: 10, cashAmount: null, cardAmount: null, orderCount: 1 },
  announced: { total: 25, cashAmount: null, cardAmount: null, orderCount: 2 },
  modifiedAfterClose: false,
});

describe('cash day helpers (D-061)', () => {
  it('formats a day in local time, 24 h', () => {
    expect(formatDayRange(closedDay(at(23, 8, 30), at(23, 22, 15)), 'fr')).toBe(
      '23/11 · 08:30 – 22:15'
    );
  });

  it('shows both dates for a day past midnight', () => {
    expect(formatDayRange(closedDay(at(23, 8, 30), at(24, 1, 10)), 'fr')).toBe(
      '23/11 08:30 → 24/11 01:10'
    );
  });

  it('flags a day opened on a previous calendar day only (answer 2 a)', () => {
    expect(isOpenedBeforeToday(at(23, 8), at(23, 23, 59))).toBe(false);
    expect(isOpenedBeforeToday(at(22, 23, 59), at(23, 0, 1))).toBe(true);
  });

  it('shows the announced totals, or the recalculated ones after a deletion (answer 17 a)', () => {
    const day = closedDay(at(23, 8), at(23, 20));
    expect(shownSummary(day).total).toBe(25);
    expect(shownSummary({ ...day, modifiedAfterClose: true }).total).toBe(10);
  });
});
