import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { CurrencyCode } from 'shared-ts';
import { getCurrency } from '../config/currency';
import { formatAmount } from '../utils/currency';

/** Instance currency and a formatter for stored amounts. */
export function useCurrency(): { currency: CurrencyCode; format: (amount: number) => string } {
  const { t } = useTranslation();
  const currency = getCurrency();
  const format = useCallback(
    (amount: number) => formatAmount(amount, currency, (count) => t('tokens', { count })),
    [currency, t]
  );
  return { currency, format };
}
