import React from 'react';
import type { CartItemType } from 'shared-ts'; // Or your central types file
import styles from './CartItem.module.css';
import Button from '../../Button';

interface CartItemProps {
  item: CartItemType;
  onRemove?: () => void;
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
      {onRemove && (
        <Button
          onClick={() => onRemove()}
          color="danger"
        >
          × 
        </Button>
    )}
    </li>
  );
};

export default CartItem;