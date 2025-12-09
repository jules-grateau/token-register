import React from 'react';
import type { ProductType } from 'shared-ts';
import ClickableCard from '../../../ClickableCard';
import { useTranslation } from 'react-i18next';
import { Text } from '@mantine/core';

interface ProductCardProps {
  product: ProductType;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { t } = useTranslation();
  return (
    <ClickableCard title={product.name} onClick={onClick}>
      {product.price !== undefined && (
        <Text c="dimmed" size="sm">
          {product.price} {t('tokens', { count: product.price })}
        </Text>
      )}
    </ClickableCard>
  );
};

export default ProductCard;
