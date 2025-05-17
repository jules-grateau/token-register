import React from 'react';
import type { CartItemType } from 'shared-ts'; // Or your central types file
import styles from './CartItem.module.css';

interface CartItemProps {
  item: CartItemType;
  onRemove: () => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove }) => {
  return (
    <li className={styles.cartItem}>
      <div className={styles.itemDetails}>
        <span className={styles.itemName}>{item.product.name}</span>
        <div className={styles.itemPriceAndQuantity}>
          {item.product.price !== undefined && (
            <span className={styles.itemPrice}> {item.product.price} Tokens </span>
          )}
          <span className={styles.itemQuantity}>× {item.quantity}</span>
        </div>
      </div>
      <button
        onClick={() => onRemove()}
        className={styles.removeButton}
        title={`Remove ${item.product.name} from cart`} // Accessibility
      >
        × {/* A simple 'x' for remove */}
      </button>
    </li>
  );
};

export default CartItem;