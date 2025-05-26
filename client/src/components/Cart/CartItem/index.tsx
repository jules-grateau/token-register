import React, { useState, useRef, useEffect } from 'react';
import type { CartItemType } from 'shared-ts';
import styles from './CartItem.module.css';
import Button from '../../Button'; // Your existing Button component
import { useTranslation } from 'react-i18next';

interface CartItemProps {
  item: CartItemType;
  onRemove?: () => void;
  onDiscount?: (item: CartItemType) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onDiscount }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreOptionsButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleDiscountClick = () => {
    onDiscount?.(item);
    setIsMenuOpen(false);
  };

  const handleRemoveClick = () => {
    onRemove?.();
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        moreOptionsButtonRef.current !== event.target
      ) {
        event.preventDefault();
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <li className={styles.cartItem}>
      <div className={styles.moreOptionsContainer}>
        {(onRemove || onDiscount) && (
          <Button
            onClick={toggleMenu}
            color="primary"
            fullHeight
            fullWidth
            ref={moreOptionsButtonRef}
          >
            ⋮
          </Button>
        )}
        {isMenuOpen && (
          <div ref={menuRef} className={styles.optionsMenu} role="menu">
            {onDiscount && (
              <button onClick={handleDiscountClick} className={`${styles.menuItem}`}>
                {t('apply_discount')}
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => handleRemoveClick()}
                className={`${styles.menuItem} ${styles.removeItem}`}
              >
                {t('delete')}
              </button>
            )}
          </div>
        )}
      </div>
      <div className={styles.itemDetails}>
        <span className={styles.itemName}>
          {item.product.name} <span className={styles.itemQuantity}>x{item.quantity}</span>
        </span>
        <div>
          {item.product.price !== undefined && (
            <>
              {item.discountedAmount != null && item.discountedAmount != 0 && (
                <span className={styles.itemPriceBeforeDiscount}>
                  {' '}
                  {item.product.price * item.quantity} {t('tokens', { count: item.product.price })}
                </span>
              )}
              <span className={styles.itemPrice}>
                {' '}
                {item.product.price * item.quantity - item.discountedAmount}{' '}
                {t('tokens', { count: item.product.price })}{' '}
              </span>
            </>
          )}
        </div>
      </div>
    </li>
  );
};

export default CartItem;
