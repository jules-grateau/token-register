import React from 'react';
import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { ProductType } from 'shared-ts';
import { useDeleteProductMutation } from '../../services/product';
import ConfirmationModal from '../ConfirmationModal';

interface ProductDeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductType | null;
}

export const ProductDeleteConfirm: React.FC<ProductDeleteConfirmProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { t } = useTranslation();
  const [deleteProduct] = useDeleteProductMutation();

  const handleConfirm = async () => {
    if (!product) return;

    try {
      await deleteProduct(product.id).unwrap();
      toast.success(t('product_management.deleted'));
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

  if (!product) return null;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => void handleConfirm()}
      title={t('product_management.delete')}
      confirmButtonText={t('delete')}
    >
      <Text>{t('product_management.delete_confirm', { name: product.name })}</Text>
    </ConfirmationModal>
  );
};

export default ProductDeleteConfirm;
