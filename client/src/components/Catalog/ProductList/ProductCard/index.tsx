import React from 'react';
import type { ProductType } from 'shared-ts';
import styles from './ProductCard.module.css';
import ClickableCard from '../../../ClickableCard';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: ProductType;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { t } = useTranslation();
  return (
    <ClickableCard title={product.name} onClick={() => onClick()}>
      {product.price !== undefined && (
        <span className={styles.productPrice}>
          {product.price} {t('tokens', { count: product.price })}
        </span>
      )}
    </ClickableCard>
  );
};

export default ProductCard;
