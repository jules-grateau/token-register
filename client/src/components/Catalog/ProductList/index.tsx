import type { ProductType } from 'shared-ts';
import ProductCard from './ProductCard';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectCartItems } from '../../../redux/cartSlice';

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
  const cartItems = useSelector(selectCartItems);
  // D-048: one cart line per product; its quantity, discount included, feeds the badge.
  const quantityByProductId = new Map(cartItems.map((item) => [item.product.id, item.quantity]));

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
          quantityInCart={quantityByProductId.get(product.id) ?? 0}
        />
      ))}
    </>
  );
}

export default ProductList;
