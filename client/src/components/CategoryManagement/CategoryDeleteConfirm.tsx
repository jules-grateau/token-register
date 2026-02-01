import React from 'react';
import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { CategoryType } from 'shared-ts';
import {
  useDeleteCategoryMutation,
  useGetProductsByCategoryQuery,
} from '../../services/categories';
import ConfirmationModal from '../ConfirmationModal';

interface CategoryDeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryType | null;
}

export const CategoryDeleteConfirm: React.FC<CategoryDeleteConfirmProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const { t } = useTranslation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const { data: products } = useGetProductsByCategoryQuery(category?.id || 0, {
    skip: !category,
  });

  const handleConfirm = async () => {
    if (!category) return;

    try {
      await deleteCategory(category.id).unwrap();
      toast.success(t('category_management.deleted'));
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

  if (!category) return null;

  const productCount = products?.length || 0;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => void handleConfirm()}
      title={t('category_management.delete')}
      confirmButtonText={t('delete')}
    >
      <Text>
        {productCount > 0
          ? t('category_management.delete_confirm', { name: category.name, count: productCount })
          : t('category_management.delete_confirm_no_products', { name: category.name })}
      </Text>
    </ConfirmationModal>
  );
};

export default CategoryDeleteConfirm;
