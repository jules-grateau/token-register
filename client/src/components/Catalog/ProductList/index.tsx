import type { ProductType } from 'shared-ts';
import ProductCard from './ProductCard';
import { useTranslation } from 'react-i18next';

interface ProductListProps {
  isLoading: boolean;
  isError: boolean;
  products: ProductType[] | undefined;
  onAddToCart: (product: ProductType) => void;
  isEditMode?: boolean;
  onEditProduct?: (product: ProductType) => void;
  onDeleteProduct?: (product: ProductType) => void;
}

function ProductList({
  isLoading,
  isError,
  products,
  onAddToCart,
  isEditMode = false,
  onEditProduct,
  onDeleteProduct,
}: ProductListProps): React.ReactNode {
  const { t } = useTranslation();

  if (isLoading) {
    return <p>{t('loading_products')}</p>;
  }

  if (isError) {
    return <p>{t('error_loading_products')}</p>;
  }

  if (!products || products.length === 0) {
    if (isEditMode) {
      return null;
    }
    return <p>{t('no_products')}</p>;
  }

  return (
    <>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => onAddToCart(product)}
          isEditMode={isEditMode}
          onEdit={onEditProduct}
          onDelete={onDeleteProduct}
        />
      ))}
    </>
  );
}

export default ProductList;
