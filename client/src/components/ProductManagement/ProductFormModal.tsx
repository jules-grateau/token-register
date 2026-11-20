import React, { useState, useEffect } from 'react';
import { Modal, TextInput, NumberInput, Select, Button, Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { CatalogIconKey, ProductType } from 'shared-ts';
import { useCreateProductMutation, useUpdateProductMutation } from '../../services/product';
import { useGetCategoriesQuery } from '../../services/categories';
import ConfirmationModal from '../ConfirmationModal';
import CatalogIconPicker from '../CatalogIcon/CatalogIconPicker';
import { isCatalogIconKey } from '../../config/catalogIcons';
import { useCurrency } from '../../hooks/useCurrency';
import {
  fromStoredAmount,
  getDecimalScale,
  hasValidPrecision,
  parseAmountInput,
  toStoredAmount,
} from '../../utils/currency';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductType | null;
  defaultCategoryId?: number | null;
}

interface ProductFormValues {
  name: string;
  /** Typed value (1.5 for 1,50 EUR), converted to the stored amount on submit. */
  price: number | string;
  categoryId: number | null;
  /** D-046: optional, "Aucune" (null) by default. */
  icon: CatalogIconKey | null;
}

const iconOf = (product?: ProductType | null): CatalogIconKey | null =>
  isCatalogIconKey(product?.icon) ? product.icon : null;

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  defaultCategoryId,
}) => {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const decimalScale = getDecimalScale(currency);
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const { data: categories } = useGetCategoriesQuery();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formValuesForConfirmation, setFormValuesForConfirmation] =
    useState<ProductFormValues | null>(null);

  const isEditMode = !!product;

  const form = useForm<ProductFormValues>({
    initialValues: {
      name: product?.name || '',
      price: product ? fromStoredAmount(product.price, currency) : 0,
      categoryId: product?.categoryId || defaultCategoryId || null,
      icon: iconOf(product),
    },
    validate: {
      name: (value) => (value.trim() ? null : t('errors.required')),
      // D-013: negative prices allowed (deposit return). D-010: 2 decimals max in EUR.
      price: (value) => {
        const amount = parseAmountInput(value);
        if (isNaN(amount)) return t('errors.required');
        if (!hasValidPrecision(amount, currency)) {
          return t(currency === 'EUR' ? 'errors.max_two_decimals' : 'errors.whole_tokens');
        }
        return null;
      },
      categoryId: (value) => (value !== null ? null : t('errors.required')),
    },
  });

  useEffect(() => {
    if (isOpen && product) {
      form.setValues({
        name: product.name,
        price: fromStoredAmount(product.price, currency),
        categoryId: product.categoryId,
        icon: iconOf(product),
      });
    } else if (isOpen && !product) {
      form.setValues({
        name: '',
        price: 0,
        categoryId: defaultCategoryId || null,
        icon: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product, defaultCategoryId]);

  const categoryOptions =
    categories?.map((category) => ({
      value: String(category.id),
      label: category.name,
    })) || [];

  const handleSubmit = (values: ProductFormValues) => {
    if (isEditMode) {
      setFormValuesForConfirmation(values);
      setShowConfirmation(true);
    } else {
      void handleCreate(values);
    }
  };

  const handleCreate = async (values: ProductFormValues) => {
    try {
      await createProduct({
        name: values.name,
        price: toStoredAmount(parseAmountInput(values.price), currency),
        categoryId: values.categoryId!,
        icon: values.icon,
      }).unwrap();
      toast.success(t('product_management.created'));
      form.reset();
      onClose();
    } catch (err) {
      const errorMessage =
        err &&
        typeof err === 'object' &&
        'data' in err &&
        err.data &&
        typeof err.data === 'object' &&
        'error' in err.data
          ? String(err.data.error)
          : t('errors.unknown');
      toast.error(errorMessage, { autoClose: 5000 });
    }
  };

  const handleUpdate = async () => {
    if (!product || !formValuesForConfirmation) return;

    try {
      await updateProduct({
        id: product.id,
        name: formValuesForConfirmation.name,
        price: toStoredAmount(parseAmountInput(formValuesForConfirmation.price), currency),
        categoryId: formValuesForConfirmation.categoryId!,
        icon: formValuesForConfirmation.icon,
      }).unwrap();
      toast.success(t('product_management.updated'));
      setShowConfirmation(false);
      setFormValuesForConfirmation(null);
      form.reset();
      onClose();
    } catch (err) {
      const errorMessage =
        err &&
        typeof err === 'object' &&
        'data' in err &&
        err.data &&
        typeof err.data === 'object' &&
        'error' in err.data
          ? String(err.data.error)
          : t('errors.unknown');
      toast.error(errorMessage, { autoClose: 5000 });
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setFormValuesForConfirmation(null);
  };

  return (
    <>
      <Modal
        opened={isOpen && !showConfirmation}
        onClose={onClose}
        title={isEditMode ? t('product_management.edit') : t('product_management.new')}
        centered
        closeButtonProps={{ 'aria-label': t('close') }}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label={t('product_management.form.name')}
              placeholder={t('product_management.form.name')}
              required
              {...form.getInputProps('name')}
            />
            <CatalogIconPicker
              value={form.values.icon}
              onChange={(icon) => form.setFieldValue('icon', icon)}
              previewName={form.values.name}
              isDeposit={parseAmountInput(form.values.price) < 0}
            />
            <NumberInput
              label={t('product_management.form.price', {
                context: currency === 'EUR' ? 'eur' : undefined,
              })}
              placeholder="0"
              required
              inputMode={decimalScale > 0 ? 'decimal' : 'numeric'}
              allowDecimal={decimalScale > 0}
              decimalScale={decimalScale > 0 ? decimalScale : undefined}
              fixedDecimalScale={decimalScale > 0}
              decimalSeparator=","
              allowedDecimalSeparators={['.', ',']}
              thousandSeparator={false}
              hideControls
              rightSection={
                currency === 'EUR' ? (
                  <Text size="sm" c="dimmed">
                    €
                  </Text>
                ) : undefined
              }
              {...form.getInputProps('price')}
            />
            <Select
              label={t('product_management.form.category')}
              placeholder={t('product_management.form.category')}
              data={categoryOptions}
              required
              value={form.values.categoryId !== null ? String(form.values.categoryId) : null}
              onChange={(value) => form.setFieldValue('categoryId', value ? Number(value) : null)}
              error={form.errors.categoryId}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button type="submit">{isEditMode ? t('actions.save') : t('actions.create')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {isEditMode && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={handleCancel}
          onConfirm={() => void handleUpdate()}
          title={t('confirmation')}
        >
          {t('product_management.edit')} &quot;{product?.name}&quot;?
        </ConfirmationModal>
      )}
    </>
  );
};

export default ProductFormModal;
