import React from 'react';
import CartItem from './CartItem';
import styles from './Cart.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, selectTotalPrice, remove, selectTotalItems, clear } from '../../redux/cartSlice';
import type { CartItemType } from 'shared-ts';
import { useAddOrderMutation, useGetOrdersQuery } from '../../services/orders';
import Button from '../Button';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

interface CartProps {
  onClickHistory: () => void;
}

const Cart: React.FC<CartProps> = ({onClickHistory} : CartProps) => {
  const { t } = useTranslation();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const totalItems = useSelector(selectTotalItems);
  const [addOrder] = useAddOrderMutation();
  const ordersQuery = useGetOrdersQuery();
  const dispatch = useDispatch();

  const onCheckout = async (cartItems : CartItemType[]) => {
    try {
      addOrder(cartItems).unwrap().then((id) => {
        dispatch(clear()); 
        ordersQuery.refetch();
        toast.success(t('order_placed', { id }));
      });
    } catch (error) {
      toast.error(t(t('error_adding_order', { error: String(error) })));
    }
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
              />
            ))}
          </ul>
          <div className={styles.checkoutContainer}>
            <Button onClick={() => onCheckout(cartItems)} fullHeight color='success'>
              {t('checkout')}
            </Button>  
            <div className={styles.cartTotal}>
              <strong>{totalItems} {t('items', { count:totalItems })}</strong>
              <br />
              <strong>{totalPrice} {t('tokens', { count:totalPrice})}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;