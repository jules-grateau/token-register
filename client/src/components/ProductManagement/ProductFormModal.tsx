import React, { useState, useEffect } from 'react';
import { Modal, TextInput, NumberInput, Select, Button, Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { CatalogIconKey, CurrencyCode, ProductType } from 'shared-ts';
import { useCreateProductMutation, useUpdateProductMutation } from '../../services/product';
import { useGetCategoriesQuery } from '../../services/categories';
import UnsavedChangesModal, { useUnsavedChangesGuard } from '../UnsavedChangesModal';
import CatalogIconPicker from '../CatalogIcon/CatalogIconPicker';
import { isCatalogIconKey } from '../../config/catalogIcons';
import { useCurrency } from '../../hooks/useCurrency';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import formClasses from '../../styles/formModal.module.css';
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

/** Values shown when the form opens: the product, or an empty form in creation. */
const valuesOf = (
  product: ProductType | null | undefined,
  defaultCategoryId: number | null | undefined,
  currency: CurrencyCode
): ProductFormValues =>
  product
    ? {
        name: product.name,
        price: fromStoredAmount(product.price, currency),
        categoryId: product.categoryId,
        icon: iconOf(product),
      }
    : { name: '', price: 0, categoryId: defaultCategoryId || null, icon: null };

/** D-052: "changed" compares the typed price as a number, so "1,50" equals 1.5. */
const isSameValues = (a: ProductFormValues, b: ProductFormValues): boolean =>
  a.name === b.name &&
  Object.is(parseAmountInput(a.price), parseAmountInput(b.price)) &&
  a.categoryId === b.categoryId &&
  a.icon === b.icon;

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  defaultCategoryId,
}) => {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const decimalScale = getDecimalScale(currency);
  const isPhone = isPhoneMode(useLayoutMode());
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  // TL-1 of PR #45: one request at a time, a double click must not create a duplicate.
  const isSaving = isCreating || isUpdating;
  const { data: categories } = useGetCategoriesQuery();
  const [openedValues, setOpenedValues] = useState<ProductFormValues>(() =>
    valuesOf(product, defaultCategoryId, currency)
  );

  const isEditMode = !!product;

  const form = useForm<ProductFormValues>({
    initialValues: valuesOf(product, defaultCategoryId, currency),
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
    if (isOpen) {
      const values = valuesOf(product, defaultCategoryId, currency);
      form.setValues(values);
      form.clearErrors();
      setOpenedValues(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product, defaultCategoryId]);

  const hasChanges = () => !isSameValues(form.getValues(), openedValues);
  const guard = useUnsavedChangesGuard(hasChanges, onClose);

  const categoryOptions =
    categories?.map((category) => ({
      value: String(category.id),
      label: category.name,
    })) || [];

  // D-052: saved at once, without confirmation; nothing changed in edit mode = just close.
  const handleSubmit = (values: ProductFormValues) => {
    if (isSaving) return;
    if (isEditMode) {
      if (isSameValues(values, openedValues)) {
        onClose();
        return;
      }
      void handleUpdate(values);
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

  const handleUpdate = async (values: ProductFormValues) => {
    if (!product) return;

    try {
      await updateProduct({
        id: product.id,
        name: values.name,
        price: toStoredAmount(parseAmountInput(values.price), currency),
        categoryId: values.categoryId!,
        icon: values.icon,
      }).unwrap();
      toast.success(t('product_management.updated'));
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

  const submit = form.onSubmit(handleSubmit);

  return (
    <>
      <Modal
        opened={isOpen && !guard.isPromptOpen}
        onClose={guard.requestClose}
        title={isEditMode ? t('product_management.edit') : t('product_management.new')}
        centered
        fullScreen={isPhone}
        closeButtonProps={{ size: 44, 'aria-label': t('close') }}
        classNames={
          isPhone ? { content: formClasses.phoneContent, body: formClasses.phoneBody } : undefined
        }
      >
        <form onSubmit={submit} className={isPhone ? formClasses.phoneForm : undefined}>
          <Stack className={isPhone ? formClasses.phoneFields : undefined}>
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
                  <Text size="md" c="var(--color-text-2)">
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
            {/* docs/design/components.md, "Modales": "Annuler" left, main action right, >= 44 px.
                D-052: the bar sticks to the bottom so "Enregistrer" stays visible on short screens. */}
            <Group
              justify="flex-end"
              gap={8}
              grow={isPhone}
              className={
                isPhone ? `${formClasses.actions} ${formClasses.phoneActions}` : formClasses.actions
              }
            >
              <Button variant="default" h={44} onClick={guard.requestClose}>
                {t('cancel')}
              </Button>
              <Button type="submit" h={44} loading={isSaving}>
                {isEditMode ? t('actions.save') : t('actions.create')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <UnsavedChangesModal
        isOpen={isOpen && guard.isPromptOpen}
        onKeepEditing={guard.keepEditing}
        onDiscard={guard.discard}
        isSaving={isSaving}
        onSave={() => {
          guard.keepEditing();
          submit();
        }}
      />
    </>
  );
};

export default ProductFormModal;
