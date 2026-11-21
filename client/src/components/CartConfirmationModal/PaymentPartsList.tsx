import React from 'react';
import { ActionIcon, Group, Stack, Text } from '@mantine/core';
import { IconCash, IconCreditCard, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { PaymentMode, PaymentParts } from '../../utils/payment';
import classes from './CartConfirmationModal.module.css';

interface PaymentPartsListProps {
  parts: PaymentParts;
  format: (amount: number) => string;
  onRemove: (mode: PaymentMode) => void;
  disabled?: boolean;
}

const MODES: PaymentMode[] = ['cash', 'card'];
const LABELS: Record<PaymentMode, string> = { cash: 'payment_cash', card: 'payment_card' };
const ICONS: Record<PaymentMode, typeof IconCash> = { cash: IconCash, card: IconCreditCard };

/** Parts already added (D-053): one line per mode, each one can be removed. */
const PaymentPartsList: React.FC<PaymentPartsListProps> = ({
  parts,
  format,
  onRemove,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const lines = MODES.filter((mode) => parts[mode] !== null);
  if (lines.length === 0) return null;

  return (
    <Stack gap={4} data-testid="payment-parts">
      {lines.map((mode) => {
        const Icon = ICONS[mode];
        const label = t(LABELS[mode]);
        return (
          <Group key={mode} justify="space-between" wrap="nowrap" gap="xs" mih={44}>
            <Group gap="xs" wrap="nowrap">
              <Icon size={20} aria-hidden />
              <Text fz={16} fw={600}>
                {label}
              </Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <Text fz={18} fw={700} style={{ whiteSpace: 'nowrap' }}>
                {format(parts[mode] ?? 0)}
              </Text>
              <ActionIcon
                variant="subtle"
                size={44}
                className={classes.inkControl}
                onClick={() => onRemove(mode)}
                disabled={disabled}
                aria-label={t('payment_remove_part', { mode: label })}
              >
                <IconTrash size={20} color={disabled ? undefined : 'var(--color-danger)'} />
              </ActionIcon>
            </Group>
          </Group>
        );
      })}
    </Stack>
  );
};

export default PaymentPartsList;
