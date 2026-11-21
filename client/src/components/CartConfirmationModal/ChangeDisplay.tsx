import React from 'react';
import { Group, Paper, Stack, Text } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCash,
  IconCheck,
  IconCoins,
  IconCreditCard,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ChangeState, PaymentMode } from '../../utils/payment';
import classes from './ChangeDisplay.module.css';
import figures from '../../styles/figures.module.css';

interface ChangeDisplayProps {
  state: ChangeState;
  format: (amount: number) => string;
  /** Phone landscape: big amounts at 32 instead of 40 (DS-5). */
  compact?: boolean;
  /** Reserved height: 112 in phone portrait (DS-4), so the screen does not jump. */
  minHeight?: number;
  /** Initial focus target when there is no amount display (never a mode button). */
  autoFocus?: boolean;
}

const PLACEHOLDERS = {
  mode: 'payment_placeholder_mode',
  cash: 'payment_placeholder_cash',
  card: 'payment_placeholder_card',
} as const;

const PART_LABELS: Record<PaymentMode, string> = {
  cash: 'payment_cash_received',
  card: 'payment_card',
};

// docs/design/components.md, "États du bloc de rendu". Always the same place and min height;
// background, border and icon colors come from ChangeDisplay.module.css (`data-state`).
// Euros only: token instances show no change block (D-053).
const ChangeDisplay: React.FC<ChangeDisplayProps> = ({
  state,
  format,
  compact = false,
  minHeight = 96,
  autoFocus = false,
}) => {
  const { t } = useTranslation();
  const bigAmount = compact ? 32 : 40;

  const receivedLine = (label: string, amount: number) => (
    <Group justify="space-between" wrap="nowrap" gap="xs">
      <Text fz={16} className={classes.label}>
        {label}
      </Text>
      <Text fz={18} fw={700} className={classes.amount}>
        {format(amount)}
      </Text>
    </Group>
  );

  // A long amount goes under its label instead of overflowing.
  const amountLine = (label: string, amount: number, size: number) => (
    <Group justify="space-between" wrap="wrap" gap="xs" align="center" style={{ rowGap: 0 }}>
      <Text fz={20} fw={700} className={classes.amount}>
        {label}
      </Text>
      <Text
        fz={size}
        fw={800}
        lh={1.1}
        ml="auto"
        className={[classes.amount, figures.big].join(' ')}
      >
        {format(amount)}
      </Text>
    </Group>
  );

  const warning = (label: string) => (
    <Group gap="xs" wrap="nowrap">
      <IconAlertTriangle size={20} className={classes.accent} aria-hidden />
      <Text fz={16} fw={600}>
        {label}
      </Text>
    </Group>
  );

  let icon: React.ReactNode = null;
  let content: React.ReactNode;

  switch (state.kind) {
    case 'empty':
      content = (
        <Text fz={16} className={classes.label}>
          {t(PLACEHOLDERS[state.hint])}
        </Text>
      );
      break;
    case 'due':
      content = amountLine(t('payment_remaining'), state.remaining, 32);
      break;
    case 'change':
      icon = <IconCoins size={28} className={classes.accent} aria-hidden />;
      content = (
        <>
          {receivedLine(t('payment_received'), state.received)}
          {amountLine(t('payment_change_due'), state.change, bigAmount)}
          {state.large && warning(t('payment_large_change'))}
        </>
      );
      break;
    case 'no-change':
      icon = <IconCheck size={28} className={classes.success} aria-hidden />;
      content = (
        <>
          {receivedLine(t('payment_received'), state.received)}
          <Text fz={24} fw={800} className={figures.big}>
            {t('payment_no_change')}
          </Text>
        </>
      );
      break;
    case 'paid':
      icon = <IconCheck size={28} className={classes.success} aria-hidden />;
      content = (
        <>
          {receivedLine(t('payment_card'), state.amount)}
          <Text fz={24} fw={800} className={figures.big}>
            {t('payment_fully_paid')}
          </Text>
        </>
      );
      break;
    case 'remaining': {
      // The rest goes to the other mode, unless it already has its part (D-053).
      const Icon = state.mode === 'cash' ? IconCreditCard : IconCash;
      icon = state.last ? (
        <IconAlertTriangle size={28} className={classes.accent} aria-hidden />
      ) : (
        <Icon size={28} className={classes.ink} aria-hidden />
      );
      content = (
        <>
          {receivedLine(t(PART_LABELS[state.mode]), state.amount)}
          {amountLine(t('payment_remaining'), state.remaining, 32)}
          {state.last && warning(t('payment_must_cover'))}
        </>
      );
      break;
    }
    case 'refund':
      icon = <IconCoins size={28} className={classes.accent} aria-hidden />;
      content = amountLine(t('payment_refund_due'), state.amount, bigAmount);
      break;
    case 'nothing-due':
      content = (
        <Text fz={20} fw={700}>
          {t('payment_nothing_due')}
        </Text>
      );
      break;
  }

  return (
    <Paper
      p="md"
      mih={minHeight}
      className={classes.block}
      data-state={state.kind}
      role="status"
      aria-live="polite"
      data-testid="change-display"
      tabIndex={autoFocus ? -1 : undefined}
      data-autofocus={autoFocus || undefined}
    >
      <Group wrap="nowrap" gap="sm" align="center" w="100%">
        {icon}
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          {content}
        </Stack>
      </Group>
    </Paper>
  );
};

export default ChangeDisplay;
