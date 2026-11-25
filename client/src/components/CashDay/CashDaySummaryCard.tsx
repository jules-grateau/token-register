import React from 'react';
import { Card, Group, Stack, Text } from '@mantine/core';
import { IconCash, IconCreditCard } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { CashDaySummaryType } from 'shared-ts';
import { useCurrency } from '../../hooks/useCurrency';
import classes from './CashDay.module.css';
import figures from '../../styles/figures.module.css';

interface CashDaySummaryCardProps {
  summary: CashDaySummaryType;
  /** Live zone: the open day's totals are announced when they change. */
  live?: boolean;
}

/**
 * Totals of a cash day (D-061, answer 4 a): the net total, then one row per payment mode in
 * euros, then the number of orders. Tokens: the total and the number of orders only (answer
 * 5 a), with no space kept for the modes.
 */
const CashDaySummaryCard: React.FC<CashDaySummaryCardProps> = ({ summary, live = false }) => {
  const { t } = useTranslation();
  const { currency, format } = useCurrency();
  const hasSplit = currency === 'EUR' && summary.cashAmount !== null && summary.cardAmount !== null;
  const modes = hasSplit
    ? [
        { label: t('payment_cash'), amount: summary.cashAmount ?? 0, icon: IconCash },
        { label: t('payment_card'), amount: summary.cardAmount ?? 0, icon: IconCreditCard },
      ]
    : [];

  return (
    <Card
      withBorder
      radius="lg"
      mih={hasSplit ? 196 : 112}
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
      data-testid="cash-day-summary"
    >
      <Stack gap="sm">
        <Group justify="space-between" align="baseline" gap="xs">
          <Text fz={16}>{t('cash_day.net_total')}</Text>
          <Text fz={32} fw={800} lh={1.15} className={`${classes.amount} ${figures.big}`}>
            {format(summary.total)}
          </Text>
        </Group>
        {modes.map(({ label, amount, icon: Icon }) => (
          <Group key={label} justify="space-between" wrap="nowrap" gap="xs">
            <Group gap="xs" wrap="nowrap">
              <Icon size={20} aria-hidden />
              <Text fz={16} fw={600}>
                {label}
              </Text>
            </Group>
            <Text fz={18} fw={700} className={classes.amount}>
              {format(amount)}
            </Text>
          </Group>
        ))}
        <Text fz={16} className={classes.secondary}>
          {t('cash_day.order_count', { count: summary.orderCount })}
        </Text>
      </Stack>
    </Card>
  );
};

export default CashDaySummaryCard;
