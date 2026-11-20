import React from 'react';
import { Box, Button, SimpleGrid } from '@mantine/core';
import { IconBackspace } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { KeypadKey } from '../../utils/payment';

interface PaymentKeypadProps {
  /** EUR: "," key. Tokens: an empty, non interactive cell instead (D-012). */
  allowDecimal: boolean;
  onKey: (key: KeypadKey) => void;
  disabled?: boolean;
  /** 3 columns (portrait, tablet, desktop) or 4 (phone landscape). */
  cols: 3 | 4;
  keyHeight: number;
}

const LAYOUTS: Record<3 | 4, (KeypadKey | null)[]> = {
  3: ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', 'backspace'],
  4: ['7', '8', '9', 'backspace', '4', '5', '6', ',', '1', '2', '3', '0'],
};

// docs/design/components.md, "Pavé numérique": built-in keypad, never the native keyboard.
const PaymentKeypad: React.FC<PaymentKeypadProps> = ({
  allowDecimal,
  onKey,
  disabled = false,
  cols,
  keyHeight,
}) => {
  const { t } = useTranslation();

  return (
    <SimpleGrid cols={cols} spacing="xs" verticalSpacing="xs">
      {LAYOUTS[cols].map((key, index) => {
        if (key === ',' && !allowDecimal) {
          return <Box key={index} h={keyHeight} aria-hidden />;
        }
        const isBackspace = key === 'backspace';
        return (
          <Button
            key={index}
            variant="default"
            h={keyHeight}
            fz={24}
            fw={700}
            px={0}
            disabled={disabled}
            onClick={() => key && onKey(key)}
            aria-label={isBackspace ? t('payment_backspace') : undefined}
          >
            {isBackspace ? <IconBackspace size={24} /> : key}
          </Button>
        );
      })}
    </SimpleGrid>
  );
};

export default PaymentKeypad;
