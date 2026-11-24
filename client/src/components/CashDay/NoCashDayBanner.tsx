import React from 'react';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconPlayerPlay } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useStartCashDay } from '../../hooks/useCashDay';
import classes from './CashDay.module.css';

interface NoCashDayBannerProps {
  /** Narrow column (phone landscape): the button goes under the text. */
  compact?: boolean;
}

/**
 * Over the cart when no cash day is open (D-061, answers 8 and 19 a): no sale is possible, and
 * the day starts here in one tap.
 */
const NoCashDayBanner: React.FC<NoCashDayBannerProps> = ({ compact = false }) => {
  const { t } = useTranslation();
  const { start, isLoading } = useStartCashDay();

  const text = (
    <Group gap="xs" wrap="nowrap" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
      <IconAlertTriangle size={20} aria-hidden style={{ flex: 'none', marginTop: 2 }} />
      <Stack gap={0} style={{ minWidth: 0 }}>
        <Text fz={16} fw={700}>
          {t('cash_day.indicator_none')}
        </Text>
        <Text fz={14} className={classes.secondary}>
          {t('cash_day.banner_help')}
        </Text>
      </Stack>
    </Group>
  );
  const button = (
    <Button
      h={44}
      onClick={() => void start()}
      loading={isLoading}
      leftSection={<IconPlayerPlay size={20} aria-hidden />}
      fullWidth={compact}
      style={{ flex: 'none' }}
    >
      {t('cash_day.start')}
    </Button>
  );

  return (
    <Paper radius="md" p="sm" m="xs" className={classes.banner} data-testid="no-cash-day-banner">
      {compact ? (
        <Stack gap="xs">
          {text}
          {button}
        </Stack>
      ) : (
        <Group gap="sm" wrap="wrap" justify="space-between">
          {text}
          {button}
        </Group>
      )}
    </Paper>
  );
};

export default NoCashDayBanner;
