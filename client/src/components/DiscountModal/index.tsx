import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import type { CartItemType } from 'shared-ts';
import { useTranslation } from 'react-i18next';
import { validateDiscountValue } from './utils/validateDiscountValue';
import { Stack, Text, Group, TextInput, SegmentedControl } from '@mantine/core';

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
  const [discountType, setDiscountType] = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const originalItemPrice = item?.product.price || 0;
  const itemQuantity = item?.quantity || 1;
  const originalTotalItemPrice = originalItemPrice * itemQuantity;

  useEffect(() => {
    setDiscountType('fixed');
    setDiscountValue('');
    setValidationError('');
  }, [isOpen, item]);

  if (!item) {
    return null;
  }

  const finalDiscountAmount = (discountValue: string) => {
    const value = parseInt(discountValue);
    if (validationError || !value) return 0;

    if (discountType === 'fixed') {
      return value;
    } else {
      return Math.ceil(originalTotalItemPrice * (value / 100));
    }
  };

  const priceAfterDiscount = (discountValue: string) => {
    return originalTotalItemPrice - finalDiscountAmount(discountValue);
  };

  const handleDiscountValueChange = (value: string) => {
    setDiscountValue(value);
    setValidationError(
      validateDiscountValue(value, discountType, originalTotalItemPrice, (key) => t(key))
    );
  };

  const handleDiscountTypeChange = (value: DiscountType) => {
    setDiscountType(value);
    setDiscountValue('');
  };

  const handleConfirm = () => {
    if (validationError) return;

    onConfirmDiscount({
      discount: finalDiscountAmount(discountValue),
    });
    onClose();
  };

  const modalContent = (
    <Stack>
      <Stack gap={4}>
        <Text fw={500}>{t('discount_type_title')}</Text>
        <SegmentedControl
          fullWidth
          value={discountType}
          onChange={(value) => handleDiscountTypeChange(value as DiscountType)}
          data={[
            {
              label: `${t('fixed_amount')} (${t('currency_symbol', {
                defaultValue: t('tokens', { count: 1 }),
              })})`,
              value: 'fixed',
            },
            { label: `${t('percentage')} (%)`, value: 'percentage' },
          ]}
        />
      </Stack>

      <TextInput
        label={<Text fw={500}>{t('discount_value_title')}</Text>}
        id="discountValueInput"
        type="text"
        inputMode="numeric"
        value={discountValue}
        onChange={(e) => handleDiscountValueChange(e.target.value)}
        placeholder={
          discountType === 'percentage'
            ? t('placeholder_percentage_discount')
            : t('placeholder_fixed_discount')
        }
        error={validationError}
      />

      <Group justify="space-between" mt="md">
        <Text>{t('new_total_price_for_item')}:</Text>
        <Text fw={700}>
          {priceAfterDiscount(discountValue)}{' '}
          {t('tokens', { count: priceAfterDiscount(discountValue) })}
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
    >
      {modalContent}
    </ConfirmationModal>
  );
};

export default DiscountModal;
