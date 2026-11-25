import type { CashDaySummaryType, CashDayType } from 'shared-ts';

// D-061 (answer 13 a): timestamps are stored in UTC and shown in the device's local time,
// day and month on 2 digits ("23/11" in French), hours on 24 h ("08:30").

export function formatDayDate(timestamp: number, language: string): string {
  return new Date(timestamp).toLocaleDateString(language, { day: '2-digit', month: '2-digit' });
}

export function formatDayTime(timestamp: number, language: string): string {
  return new Date(timestamp).toLocaleTimeString(language, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

/** True when both timestamps fall on the same local calendar day. */
export function isSameLocalDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** Answer 2 a: a day opened on a previous calendar day is flagged ("Ouverte depuis le 22/11"). */
export function isOpenedBeforeToday(openedAt: number, now: number = Date.now()): boolean {
  return !isSameLocalDay(openedAt, now) && openedAt < now;
}

/**
 * "23/11 · 08:30 – 22:15", or "23/11 08:30 → 24/11 01:10" for a day that goes past midnight
 * (docs/design/components.md, "Journée de caisse").
 */
export function formatDayRange(day: CashDayType, language: string): string {
  const openDate = formatDayDate(day.openedAt, language);
  const openTime = formatDayTime(day.openedAt, language);
  if (day.closedAt === null) return `${openDate} · ${openTime}`;
  const closeTime = formatDayTime(day.closedAt, language);
  if (isSameLocalDay(day.openedAt, day.closedAt)) return `${openDate} · ${openTime} – ${closeTime}`;
  return `${openDate} ${openTime} → ${formatDayDate(day.closedAt, language)} ${closeTime}`;
}

/**
 * Totals shown for a closed day: the ones announced at the close, unless an order was deleted
 * afterwards; the recalculated ones are then shown with the announced total (answer 17 a).
 */
export function shownSummary(day: CashDayType): CashDaySummaryType {
  return day.announced && !day.modifiedAfterClose ? day.announced : day.summary;
}
