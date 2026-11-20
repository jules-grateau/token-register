import React from 'react';
import { Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconCoins, IconCreditCard } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { CurrencyCode } from 'shared-ts';
import type { ChangeState } from '../../utils/payment';

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

const YELLOW = 'var(--mantine-color-yellow-8)';
const INFO = 'var(--color-info-bg)';
const RED = 'var(--mantine-color-red-6)';
const DEFAULT_BORDER = 'var(--mantine-color-default-border)';
const NOWRAP = { whiteSpace: 'nowrap' } as const;

// docs/design/components.md, "États du bloc de rendu". Always the same place and min height.
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
      <Text fz={16} c="dimmed">
        {label}
      </Text>
      <Text fz={18} fw={700} style={NOWRAP}>
        {format(amount)}
      </Text>
    </Group>
  );

  // A long amount ("12 Jetons") goes under its label instead of overflowing; in phone landscape
  // it is 28 px in tokens so that the block stays low enough for "Encaisser" (DS-5).
  const amountLine = (label: string, amount: number, size: number, color?: string) => (
    <Group justify="space-between" wrap="wrap" gap="xs" align="center" style={{ rowGap: 0 }}>
      <Text fz={20} fw={700} style={NOWRAP}>
        {label}
      </Text>
      <Text fz={size} fw={800} c={color} style={NOWRAP} lh={1.1} ml="auto">
        {format(amount)}
      </Text>
    </Group>
  );

  let border = `1px solid ${DEFAULT_BORDER}`;
  let icon: React.ReactNode = null;
  let content: React.ReactNode;

  switch (state.kind) {
    case 'empty':
      content = (
        <Text fz={16} c="dimmed">
          {t(isTokens ? 'payment_placeholder_tokens' : 'payment_placeholder')}
        </Text>
      );
      break;
    case 'change':
      border = `2px solid ${YELLOW}`;
      icon = <IconCoins size={28} color={YELLOW} aria-hidden />;
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
              <IconAlertTriangle size={20} color={YELLOW} aria-hidden />
              <Text fz={16} fw={600}>
                {t('payment_large_change')}
              </Text>
            </Group>
          )}
        </>
      );
      break;
    case 'no-change':
      border = `2px solid ${DEFAULT_BORDER}`;
      icon = <IconCheck size={28} aria-hidden />;
      content = (
        <>
          {receivedLine(t('payment_received'), state.received)}
          <Text fz={24} fw={800}>
            {t('payment_no_change')}
          </Text>
        </>
      );
      break;
    case 'remaining':
      border = `2px solid ${INFO}`;
      icon = <IconCreditCard size={28} color={INFO} aria-hidden />;
      content = (
        <>
          {receivedLine(t('payment_cash_received'), state.received)}
          {amountLine(t('payment_remaining'), state.remaining, 32)}
        </>
      );
      break;
    case 'missing':
      border = `2px solid ${RED}`;
      icon = <IconAlertTriangle size={28} color={RED} aria-hidden />;
      content = (
        <>
          {receivedLine(t('payment_received'), state.received)}
          {amountLine(t('payment_missing'), state.missing, 32, 'red.4')}
        </>
      );
      break;
    case 'refund':
      border = `2px solid ${YELLOW}`;
      icon = <IconCoins size={28} color={YELLOW} aria-hidden />;
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
      radius="md"
      p="md"
      mih={minHeight}
      bg="dark.6"
      style={{ border, display: 'flex', alignItems: 'center' }}
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
