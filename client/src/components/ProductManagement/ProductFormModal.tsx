import React, { useState, useEffect } from 'react';
import { Modal, TextInput, NumberInput, Select, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { ProductType } from 'shared-ts';
import { useCreateProductMutation, useUpdateProductMutation } from '../../services/product';
import { useGetCategoriesQuery } from '../../services/categories';
import ConfirmationModal from '../ConfirmationModal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductType | null;
  defaultCategoryId?: number | null;
}

interface ProductFormValues {
  name: string;
  price: number;
  categoryId: number | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  defaultCategoryId,
}) => {
  const { t } = useTranslation();
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
      price: product?.price || 0,
      categoryId: product?.categoryId || defaultCategoryId || null,
    },
    validate: {
      name: (value) => (value.trim() ? null : t('errors.required')),
      price: (value) => (value >= 0 ? null : t('errors.min_price')),
      categoryId: (value) => (value !== null ? null : t('errors.required')),
    },
  });

  useEffect(() => {
    if (isOpen && product) {
      form.setValues({
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
      });
    } else if (isOpen && !product) {
      form.setValues({
        name: '',
        price: 0,
        categoryId: defaultCategoryId || null,
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
        price: values.price,
        categoryId: values.categoryId!,
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
      toast.error(errorMessage);
    }
  };

  const handleUpdate = async () => {
    if (!product || !formValuesForConfirmation) return;

    try {
      await updateProduct({
        id: product.id,
        name: formValuesForConfirmation.name,
        price: formValuesForConfirmation.price,
        categoryId: formValuesForConfirmation.categoryId!,
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
      toast.error(errorMessage);
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
            <NumberInput
              label={t('product_management.form.price')}
              placeholder="0"
              required
              min={0}
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
