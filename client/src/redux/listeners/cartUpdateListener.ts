import { isAnyOf } from '@reduxjs/toolkit';
import { AppStartListening } from '.';
import { add, remove, clearCart, addDiscount, restoreCart, updateQuantity } from '../cartSlice';
import { saveCartToLocalStorage } from '../../utils/localStorageCart';

export default (startListening: AppStartListening) =>
  startListening({
    matcher: isAnyOf(add, remove, clearCart, addDiscount, restoreCart, updateQuantity),
    effect: (_action, store) => {
      const newCartState = store.getState().cart;
      saveCartToLocalStorage(newCartState);
    },
  });
