import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import type { CartItemType } from 'shared-ts';
import { useTranslation } from 'react-i18next';
import styles from './DiscountModal.module.css';
import clsx from 'clsx';

export type DiscountType = 'percentage' | 'fixed';

export interface DiscountDetails {
  discount: number;
}

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDiscount: (discountDetails: DiscountDetails) => void;
  item?: CartItemType;
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

  const validateDiscountValue = (discountValue: string) => {
    setValidationError('');
    if (!discountValue) return;

    const value = parseInt(discountValue);

    if (isNaN(value) || value <= 0 || originalTotalItemPrice < 0) {
      setValidationError(t('error_invalid_discount_value_positive'));
      return;
    }

    if (discountType === 'fixed' && value > originalTotalItemPrice) {
      setValidationError(t('error_invalid_fixed_value_over_total_price'));
    }

    if (discountType === 'percentage' && value > 100) {
      setValidationError(t('error_invalid_percentage_value_max_100'));
      return;
    }
  };

  const handleDiscountValueChange = (value: string) => {
    setDiscountValue(value);
    validateDiscountValue(value);
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
    <div className={styles.discountFormContainer}>
      <div>
        <h3 className={styles.sectionTitle}>{t('discount_type_title')}</h3>
        <div className={styles.discountTypeGroup}>
          <label
            className={clsx(styles.discountTypeLabel, discountType === 'fixed' && styles.selected)}
          >
            <input
              type="radio"
              name="discountType"
              value="fixed"
              checked={discountType === 'fixed'}
              onChange={() => handleDiscountTypeChange('fixed')}
            />
            <span className={styles.customRadio}></span>
            <span>
              {t('fixed_amount')} (
              {t('currency_symbol', { defaultValue: t('tokens', { count: 1 }) })})
            </span>
          </label>
          <label
            className={clsx(
              styles.discountTypeLabel,
              discountType === 'percentage' && styles.selected
            )}
          >
            <input
              type="radio"
              name="discountType"
              value="percentage"
              checked={discountType === 'percentage'}
              onChange={() => handleDiscountTypeChange('percentage')}
            />
            <span className={styles.customRadio}></span>
            <span>{t('percentage')} (%)</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className={styles.sectionTitle}>{t('discount_value_title')}</h3>
        <div className={styles.discountValueGroup}>
          <input
            id="discountValueInput"
            type="text"
            inputMode="numeric"
            className={styles.discountValueInput}
            value={discountValue}
            onChange={(e) => handleDiscountValueChange(e.target.value)}
            placeholder={
              discountType === 'percentage'
                ? t('placeholder_percentage_discount')
                : t('placeholder_fixed_discount')
            }
          />
          <p className={styles.errorMessage}>{validationError}</p>
        </div>
      </div>

      {
        <div className={styles.newPriceSection}>
          <span className={styles.newPriceLabel}>{t('new_total_price_for_item')}:</span>
          <span className={styles.newPriceValue}>
            {priceAfterDiscount(discountValue)}{' '}
            {t('tokens', { count: priceAfterDiscount(discountValue) })}
          </span>
        </div>
      }
    </div>
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
