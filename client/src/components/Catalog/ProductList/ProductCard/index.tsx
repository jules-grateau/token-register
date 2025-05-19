import React from "react";
import type { ProductType } from "shared-ts";
import styles from "./ProductCard.module.css";
import ClickableCard from "../../../ClickableCard";


interface ProductCardProps {
    product: ProductType,
    onClick: () => void;
}


export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
 return (
  <ClickableCard
    title={product.name}
    onClick={() => onClick()}
    >
      {product.price !== undefined && (
        <span className={styles.productPrice}>{product.price} Tokens</span>
      )}
  </ClickableCard>
  );
};

export default ProductCard;