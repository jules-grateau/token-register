import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import type { CartItemType } from 'shared-ts';
import { useTranslation } from 'react-i18next';
import { validateDiscountValue } from './utils/validateDiscountValue';
import { Stack, Text, Group, NumberInput, SegmentedControl } from '@mantine/core';
import { useCurrency } from '../../hooks/useCurrency';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
// Same look as the light / dark switch (docs/design/components.md, "Bascule clair/sombre").
import segmentedClasses from '../ColorSchemeControl/ColorSchemeControl.module.css';
import {
  computePercentageDiscount,
  getDecimalScale,
  parseAmountInput,
  toStoredAmount,
} from '../../utils/currency';

export type DiscountType = 'percentage' | 'fixed';

export interface DiscountDetails {
  discount: number;
}

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDiscount: (discountDetails: DiscountDetails) => void;
  item: CartItemType;
}

const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  onConfirmDiscount,
  item,
}) => {
  const { t } = useTranslation();
  const { currency, format } = useCurrency();
  const isPhone = isPhoneMode(useLayoutMode());
  const [discountType, setDiscountType] = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState<number | string>('');
  const [validationError, setValidationError] = useState<string>('');

  const originalItemPrice = item?.product.price || 0;
  const itemQuantity = item?.quantity || 1;
  const originalTotalItemPrice = originalItemPrice * itemQuantity;
  const isEur = currency === 'EUR';
  const i18nContext = isEur ? 'eur' : undefined;

  useEffect(() => {
    setDiscountType('fixed');
    setDiscountValue('');
    setValidationError('');
  }, [isOpen, item]);

  if (!item) {
    return null;
  }

  /** Discount as a stored amount (tokens or cents). */
  const finalDiscountAmount = (discountValue: number | string) => {
    const value = parseAmountInput(discountValue);
    if (validationError || !value) return 0;

    if (discountType === 'fixed') {
      return toStoredAmount(value, currency);
    }
    // D-010: rounded up to the next token / cent, in favour of the customer.
    return computePercentageDiscount(originalTotalItemPrice, value);
  };

  const priceAfterDiscount = (discountValue: number | string) => {
    return originalTotalItemPrice - finalDiscountAmount(discountValue);
  };

  const handleDiscountValueChange = (value: number | string) => {
    setDiscountValue(value);
    setValidationError(
      validateDiscountValue(value, discountType, originalTotalItemPrice, currency, (key) => t(key))
    );
  };

  const handleDiscountTypeChange = (value: DiscountType) => {
    setDiscountType(value);
    setDiscountValue('');
    setValidationError('');
  };

  const handleConfirm = () => {
    if (validationError) return;

    onConfirmDiscount({
      discount: finalDiscountAmount(discountValue),
    });
    onClose();
  };

  const isFixed = discountType === 'fixed';
  const decimalScale = isFixed ? getDecimalScale(currency) : 0;
  const unitSuffix = isFixed ? (isEur ? '€' : undefined) : '%';

  const modalContent = (
    <Stack>
      <Stack gap={4}>
        <Text fw={600}>{t('discount_type_title')}</Text>
        <SegmentedControl
          fullWidth
          radius="md"
          color="encre"
          classNames={{ root: segmentedClasses.root, label: segmentedClasses.label }}
          // "Montant fixe (Jeton)" may not fit on one line at 360 px: it wraps, never cut.
          styles={{ label: { whiteSpace: 'normal', textAlign: 'center' } }}
          value={discountType}
          onChange={(value) => handleDiscountTypeChange(value as DiscountType)}
          data={[
            {
              label: `${t('fixed_amount')} (${t('currency_symbol', { context: i18nContext })})`,
              value: 'fixed',
            },
            { label: `${t('percentage')} (%)`, value: 'percentage' },
          ]}
        />
      </Stack>

      <NumberInput
        label={<Text fw={600}>{t('discount_value_title')}</Text>}
        id="discountValueInput"
        value={discountValue}
        onChange={handleDiscountValueChange}
        inputMode={decimalScale > 0 ? 'decimal' : 'numeric'}
        allowDecimal={decimalScale > 0}
        decimalScale={decimalScale > 0 ? decimalScale : undefined}
        fixedDecimalScale={decimalScale > 0}
        decimalSeparator=","
        allowedDecimalSeparators={['.', ',']}
        thousandSeparator={false}
        hideControls
        rightSection={
          unitSuffix ? (
            <Text size="md" c="var(--color-text-2)">
              {unitSuffix}
            </Text>
          ) : undefined
        }
        placeholder={
          isFixed
            ? t('placeholder_fixed_discount', { context: i18nContext })
            : t('placeholder_percentage_discount')
        }
        error={validationError}
      />

      <Group justify="space-between" mt="md">
        <Text>{t('new_total_price_for_item')}:</Text>
        <Text fw={800} style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {format(priceAfterDiscount(discountValue))}
        </Text>
      </Group>
    </Stack>
  );

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('apply_discount', { itemName: item.product.name })}
      fullScreen={isPhone}
    >
      {modalContent}
    </ConfirmationModal>
  );
};

export default DiscountModal;
