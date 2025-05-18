import React from 'react';
import CartItem from './CartItem';
import styles from './Cart.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, selectTotalPrice, remove, selectTotalItems, clear } from '../../redux/cartSlice';
import type { CartItemType } from 'shared-ts';
import { useAddOrderMutation } from '../../services/orders';
import Button from '../Button';


const Cart: React.FC = () => {
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const totalItems = useSelector(selectTotalItems);
  const [addOrder] = useAddOrderMutation();
  
  const dispatch = useDispatch();

  const onCheckout = async (cartItems : CartItemType[]) => {
    try {
      addOrder(cartItems).unwrap().then(() => dispatch(clear()));
    } catch (error) {
      alert('Error adding order: ' + error);
    }
  }; 

  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartHeader}>
        <h2 className={styles.areaTitle}>Cart</h2>
        <Button onClick={() => dispatch(clear())}> History </Button>
      </div>
      {cartItems.length === 0 ? (
        <p className={styles.emptyCartMessage}>Your cart is empty.</p>
      ) : (
        <>
          <ul className={styles.cartList}>
            {cartItems.map((item, index) => (
              // If the same product can be added multiple times and needs unique removal,
              // you'd need a unique key per cart instance, not just product.id.
              // For now, assuming product.id is unique enough for the list key if items are distinct products.
              // Or, if items can be duplicated, use `item.id + '-' + index` for a more robust key.
              <CartItem
                key={index} // Handle duplicate products by making key unique
                item={item}
                onRemove={() => dispatch(remove(index))} // Assuming remove is an action creator
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