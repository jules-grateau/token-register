import React from 'react';
import type { ProductType } from 'shared-ts';
import ProductCard from './ProductCard'; 
import { useTranslation } from 'react-i18next';

interface ProductListProps {
  isLoading: boolean;
  isError: boolean;
  products: ProductType[] | undefined;
  onAddToCart: (product: ProductType) => void;
}

const ProductList: React.FC<ProductListProps> = ({ isLoading, isError, products, onAddToCart }) => {
  const { t } = useTranslation();

  if (isLoading) return <p>{t('loading_products')}</p>;
  if (isError) return <p>{t('error_loading_products')}</p>;
  if (!products || products.length === 0) return <p>{t('no_products')}</p>;

  return (
    <>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => onAddToCart(product)} 
        />
      ))}
    </>
  );
};

export default ProductList;