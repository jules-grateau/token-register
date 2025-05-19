import React from 'react';
import type { ProductType } from 'shared-ts';
import ProductCard from './ProductCard'; 


interface ProductListProps {
  isLoading: boolean;
  isError: boolean;
  products: ProductType[] | undefined;
  onAddToCart: (product: ProductType) => void;
}

const ProductList: React.FC<ProductListProps> = ({ isLoading, isError, products, onAddToCart }) => {

    if (isLoading) return <p>Loading products...</p>;
  if (isError) return <p>Error loading products.</p>;
  if (!products || products.length === 0) return <p>No products in this category.</p>;

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