import React from 'react';
import { Button } from '@mantine/core';
import { IconAlertTriangle, IconCalendarEvent } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useCurrentCashDay } from '../../hooks/useCashDay';
import { formatDayDate, formatDayTime, isOpenedBeforeToday } from '../../utils/cashDay';
import classes from './CashDay.module.css';

interface CashDayIndicatorProps {
  /** Phone landscape: icon + time (or "Aucune journée"), the full text in the aria-label. */
  short?: boolean;
  /** Phone portrait: the text may wrap on two lines. */
  wrap?: boolean;
  onClick: () => void;
}

/**
 * State of the cash day in the header (D-061, answers 2 a and 8 a): a button that opens the
 * "Journée de caisse" modal. Hidden until the API answered.
 */
const CashDayIndicator: React.FC<CashDayIndicatorProps> = ({
  short = false,
  wrap = false,
  onClick,
}) => {
  const { t, i18n } = useTranslation();
  const { cashDay, isKnown } = useCurrentCashDay();
  if (!isKnown) return null;

  const language = i18n.language;
  const state = (() => {
    if (!cashDay) {
      return {
        alert: true,
        label: t('cash_day.indicator_none'),
        shortLabel: t('cash_day.indicator_none_short'),
      };
    }
    if (isOpenedBeforeToday(cashDay.openedAt)) {
      const date = formatDayDate(cashDay.openedAt, language);
      return { alert: true, label: t('cash_day.indicator_open_since', { date }), shortLabel: date };
    }
    const time = formatDayTime(cashDay.openedAt, language);
    return { alert: false, label: t('cash_day.indicator_open', { time }), shortLabel: time };
  })();
  const Icon = state.alert ? IconAlertTriangle : IconCalendarEvent;

  return (
    <Button
      variant="default"
      h={44}
      px="sm"
      onClick={onClick}
      leftSection={<Icon size={20} aria-hidden />}
      aria-label={t('cash_day.indicator_aria', { state: state.label })}
      className={classes.indicator}
      data-alert={state.alert || undefined}
      data-testid="cash-day-indicator"
      style={{ flex: 'none', maxWidth: '100%' }}
      styles={{ label: wrap ? { whiteSpace: 'normal', height: 'auto' } : undefined }}
    >
      <span
        className={classes.indicatorLabel}
        data-wrap={wrap || undefined}
        style={{ fontSize: 14, fontWeight: state.alert ? 700 : 600 }}
      >
        {short ? state.shortLabel : state.label}
      </span>
    </Button>
  );
};

export default CashDayIndicator;
