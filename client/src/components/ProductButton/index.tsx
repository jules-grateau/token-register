import React from "react";
import type { Product } from "shared-ts";
import "./ProductButton.css";


interface ProductButtonProps {
    product: Product,
    onClick: () => void;
}


export const ProductButton: React.FC<ProductButtonProps> = ({ product, onClick }) => {
  return (
    <button className="product-button" onClick={onClick}>
      <div className="product-name">{product.name}</div>
      <div className="product-price">{product.price} Tokens</div>
    </button>
  );
};

export default ProductButton;