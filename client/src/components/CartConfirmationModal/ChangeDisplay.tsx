import React from 'react';
import { Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconCoins, IconCreditCard } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { CurrencyCode } from 'shared-ts';
import type { ChangeState } from '../../utils/payment';
import classes from './ChangeDisplay.module.css';
import figures from '../../styles/figures.module.css';

interface ChangeDisplayProps {
  state: ChangeState;
  currency: CurrencyCode;
  format: (amount: number) => string;
  /** Phone landscape: big amounts at 32 instead of 40, and 28 in tokens (DS-5). */
  compact?: boolean;
  /** Reserved height: 112 in phone portrait (DS-4), so the screen does not jump. */
  minHeight?: number;
  /** Initial focus target when there is no amount display (never "Carte"). */
  autoFocus?: boolean;
}

// docs/design/components.md, "États du bloc de rendu". Always the same place and min height;
// background, border and icon colors come from ChangeDisplay.module.css (`data-state`).
const ChangeDisplay: React.FC<ChangeDisplayProps> = ({
  state,
  currency,
  format,
  compact = false,
  minHeight = 96,
  autoFocus = false,
}) => {
  const { t } = useTranslation();
  const isTokens = currency === 'TOKEN';
  const bigAmount = compact ? (isTokens ? 28 : 32) : 40;

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

  // A long amount ("12 Jetons") goes under its label instead of overflowing; in phone landscape
  // it is 28 px in tokens so that the block stays low enough for "Encaisser" (DS-5).
  const amountLine = (label: string, amount: number, size: number, colorClass?: string) => (
    <Group justify="space-between" wrap="wrap" gap="xs" align="center" style={{ rowGap: 0 }}>
      <Text fz={20} fw={700} className={classes.amount}>
        {label}
      </Text>
      <Text
        fz={size}
        fw={800}
        lh={1.1}
        ml="auto"
        className={[classes.amount, figures.big, colorClass].filter(Boolean).join(' ')}
      >
        {format(amount)}
      </Text>
    </Group>
  );

  let icon: React.ReactNode = null;
  let content: React.ReactNode;

  switch (state.kind) {
    case 'empty':
      content = (
        <Text fz={16} className={classes.label}>
          {t(isTokens ? 'payment_placeholder_tokens' : 'payment_placeholder')}
        </Text>
      );
      break;
    case 'change':
      icon = <IconCoins size={28} className={classes.accent} aria-hidden />;
      content = (
        <>
          {receivedLine(t('payment_received'), state.received)}
          {amountLine(
            t(isTokens ? 'payment_tokens_change_due' : 'payment_change_due'),
            state.change,
            bigAmount
          )}
          {state.large && (
            <Group gap="xs" wrap="nowrap">
              <IconAlertTriangle size={20} className={classes.accent} aria-hidden />
              <Text fz={16} fw={600}>
                {t('payment_large_change')}
              </Text>
            </Group>
          )}
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
    case 'remaining':
      icon = <IconCreditCard size={28} className={classes.ink} aria-hidden />;
      content = (
        <>
          {receivedLine(t('payment_cash_received'), state.received)}
          {amountLine(t('payment_remaining'), state.remaining, 32)}
        </>
      );
      break;
    case 'missing':
      icon = <IconAlertTriangle size={28} className={classes.danger} aria-hidden />;
      content = (
        <>
          {receivedLine(t('payment_received'), state.received)}
          {amountLine(t('payment_missing'), state.missing, 32, classes.danger)}
        </>
      );
      break;
    case 'refund':
      icon = <IconCoins size={28} className={classes.accent} aria-hidden />;
      content = amountLine(
        t(isTokens ? 'payment_tokens_refund_due' : 'payment_refund_due'),
        state.amount,
        bigAmount
      );
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
