import React, { useState } from 'react';
import CartItem from './CartItem';
import styles from './Cart.module.css';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCartItems,
  selectTotalPrice,
  remove,
  selectTotalItems,
  addDiscount,
} from '../../redux/cartSlice';
import Button from '../Button';
import { useTranslation } from 'react-i18next';
import type { CartItemType } from 'shared-ts';
import DiscountModal, { type DiscountDetails } from '../DiscountModal';

interface CartProps {
  onClickHistory: () => void;
  onValidateCart: () => void;
}

const Cart: React.FC<CartProps> = ({ onClickHistory, onValidateCart }: CartProps) => {
  const { t } = useTranslation();
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountModalTarget, setDiscountModalTarget] = useState<CartItemType>();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const totalItems = useSelector(selectTotalItems);
  const dispatch = useDispatch();

  const openDiscountModal = (cartItem: CartItemType) => {
    setIsDiscountModalOpen(true);
    setDiscountModalTarget(cartItem);
  };

  const handleConfirmDiscountModal = (discountDetails: DiscountDetails) => {
    setIsDiscountModalOpen(false);
    dispatch(
      addDiscount({
        productId: discountModalTarget?.product.id || 0,
        discountedAmount: discountDetails.discount,
      })
    );
  };

  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartHeader}>
        <h2 className={styles.areaTitle}>{t('cart')}</h2>
        <Button onClick={onClickHistory}>{t('history')}</Button>
      </div>
      {cartItems.length === 0 ? (
        <p className={styles.emptyCartMessage}>{t('your_cart_is_empty')}</p>
      ) : (
        <>
          <ul className={styles.cartList}>
            {cartItems.map((item, index) => (
              <CartItem
                key={index}
                item={item}
                onRemove={() => dispatch(remove(index))}
                onDiscount={openDiscountModal}
              />
            ))}
          </ul>
          <div className={styles.checkoutContainer}>
            <Button onClick={onValidateCart} fullHeight color="success">
              {t('checkout')}
            </Button>
            <div className={styles.cartTotal}>
              <strong data-testid="cart-total-item">
                {totalItems} {t('items', { count: totalItems })}
              </strong>
              <br />
              <strong data-testid="item-total-price">
                {totalPrice} {t('tokens', { count: totalPrice })}
              </strong>
            </div>
          </div>
        </>
      )}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        item={discountModalTarget}
        onClose={() => setIsDiscountModalOpen(false)}
        onConfirmDiscount={handleConfirmDiscountModal}
      />
    </div>
  );
};

export default Cart;
