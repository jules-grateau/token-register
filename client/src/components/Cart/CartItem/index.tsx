import React from 'react';
import type { CartItemType } from 'shared-ts';
import styles from './CartItem.module.css';
import Button from '../../Button';
import { useTranslation } from 'react-i18next';

interface CartItemProps {
  item: CartItemType;
  onRemove?: () => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove }) => {
  const { t } = useTranslation();
  return (
    <li className={styles.cartItem}>
      <div className={styles.itemDetails}>

        <span className={styles.itemName}>         
          {item.product.name} <span className={styles.itemQuantity}>x{item.quantity}</span>
          </span>
        <div className={styles.itemPriceAndQuantity}>
          {item.product.price !== undefined && (
            <span className={styles.itemPrice}> {item.product.price} {t('tokens', { count:item.product.price })} </span>
          )}

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