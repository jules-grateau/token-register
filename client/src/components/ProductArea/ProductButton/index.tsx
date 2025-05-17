import React from "react";
import type { ProductType } from "shared-ts";
import styles from "./ProductButton.module.css";


interface ProductButtonProps {
    product: ProductType,
    onClick: () => void;
}


export const ProductButton: React.FC<ProductButtonProps> = ({ product, onClick }) => {
 return (
    <button
      className={styles.productCard}
      onClick={() => onClick()}
      title={`Add ${product.name} to cart`} // Accessibility
    >
      <span className={styles.productName}>{product.name}</span>
      {product.price !== undefined && (
        <span className={styles.productPrice}>{product.price} Tokens</span>
      )}
    </button>
  );
};

export default ProductButton;