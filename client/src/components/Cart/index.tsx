import React from 'react';
import CartItem from './CartItem';
import styles from './Cart.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, selectTotalPrice, remove, selectTotalItems, clear } from '../../redux/cartSlice';
import type { CartItemType } from 'shared-ts';
import { useAddOrderMutation, useGetOrdersQuery } from '../../services/orders';
import Button from '../Button';

interface CartProps {
  onClickHistory: () => void;
}

const Cart: React.FC<CartProps> = ({onClickHistory} : CartProps) => {
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const totalItems = useSelector(selectTotalItems);
  const [addOrder] = useAddOrderMutation();
  const ordersQuery = useGetOrdersQuery();
  const dispatch = useDispatch();

  const onCheckout = async (cartItems : CartItemType[]) => {
    try {
      addOrder(cartItems).unwrap().then(() => {
        dispatch(clear()); 
        ordersQuery.refetch();
      });
    } catch (error) {
      alert('Error adding order: ' + error);
    }
  }; 

  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartHeader}>
        <h2 className={styles.areaTitle}>Cart</h2>
        <Button onClick={onClickHistory}> History </Button>
      </div>
      {cartItems.length === 0 ? (
        <p className={styles.emptyCartMessage}>Your cart is empty.</p>
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
            <Button onClick={() => onCheckout(cartItems)} fullHeight color='success'> Checkout </Button>  
            <div className={styles.cartTotal}>
              <strong>{totalItems} Items</strong>
              <br />
              <strong>{totalPrice} Tokens</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;