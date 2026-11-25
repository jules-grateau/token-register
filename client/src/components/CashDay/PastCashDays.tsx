import React from 'react';
import { Badge, Card, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconCash, IconCreditCard } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { CashDayType } from 'shared-ts';
import { useCurrency } from '../../hooks/useCurrency';
import { formatDayRange, shownSummary } from '../../utils/cashDay';
import classes from './CashDay.module.css';

interface PastCashDaysProps {
  days: CashDayType[] | undefined;
  onSelect: (day: CashDayType) => void;
}

/**
 * "Journées passées" (D-061, answers 6 a, 16 a, 17 a): the 50 most recent closed days. Touching a
 * day lists its orders, which can be deleted there.
 */
const PastCashDays: React.FC<PastCashDaysProps> = ({ days, onSelect }) => {
  const { t, i18n } = useTranslation();
  const { currency, format } = useCurrency();

  return (
    <Stack gap="sm" data-testid="past-cash-days">
      <Text fz={18} fw={700}>
        {t('cash_day.past_title')}
      </Text>
      {days && days.length === 0 && (
        <Text fz={16} className={classes.secondary}>
          {t('cash_day.past_empty')}
        </Text>
      )}
      {days?.map((day) => {
        const summary = shownSummary(day);
        // Same rule as the history badges: euros only, none for a day without split.
        const modes =
          currency === 'EUR' && summary.cashAmount !== null && summary.cardAmount !== null
            ? [
                { mode: t('payment_cash'), amount: summary.cashAmount, icon: IconCash },
                { mode: t('payment_card'), amount: summary.cardAmount, icon: IconCreditCard },
              ]
            : [];
        const range = formatDayRange(day, i18n.language);
        return (
          <UnstyledButton
            key={day.id}
            className={classes.pastDay}
            onClick={() => onSelect(day)}
            aria-label={t('cash_day.past_open_aria', { range })}
          >
            <Card withBorder radius="lg">
              <Stack gap={6}>
                <Text fz={16} fw={700}>
                  {range}
                </Text>
                <Text fz={18} fw={800} className={classes.amount}>
                  {format(summary.total)}
                </Text>
                {modes.length > 0 && (
                  <Group gap="xs">
                    {modes.map(({ mode, amount, icon: Icon }) => (
                      <Badge
                        key={mode}
                        size="lg"
                        variant="default"
                        tt="none"
                        fz={14}
                        fw={600}
                        leftSection={<Icon size={16} />}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {t('payment_badge', { mode, amount: format(amount) })}
                      </Badge>
                    ))}
                  </Group>
                )}
                {day.modifiedAfterClose && day.announced && (
                  <Text fz={14} className={classes.secondary} data-testid="cash-day-modified">
                    {t('cash_day.modified_after_close', { total: format(day.announced.total) })}
                  </Text>
                )}
                <Text fz={14} className={classes.secondary}>
                  {t('cash_day.order_count', { count: summary.orderCount })} ·{' '}
                  {t('cash_day.past_open_hint')}
                </Text>
              </Stack>
            </Card>
          </UnstyledButton>
        );
      })}
    </Stack>
  );
};

export default PastCashDays;
