import React from 'react';
import type { ProductType } from 'shared-ts';
import ProductCard from './ProductCard';
import { useTranslation } from 'react-i18next';
import ClickableCard from '../../ClickableCard';

interface ProductListProps {
  isLoading: boolean;
  isError: boolean;
  products: ProductType[] | undefined;
  onAddToCart: (product: ProductType) => void;
  onGoBack: () => void;
}

const ProductList: React.FC<ProductListProps> = ({
  onGoBack,
  isLoading,
  isError,
  products,
  onAddToCart,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {isLoading ? (
        <p>{t('loading_products')}</p>
      ) : isError ? (
        <p>{t('error_loading_products')}</p>
      ) : !products || products.length === 0 ? (
        <p>{t('no_products')}</p>
      ) : (
        products.map((product) => (
          <ProductCard key={product.id} product={product} onClick={() => onAddToCart(product)} />
        ))
      )}
      <ClickableCard title={t('go_back')} onClick={onGoBack} />
    </>
  );
};

export default ProductList;
