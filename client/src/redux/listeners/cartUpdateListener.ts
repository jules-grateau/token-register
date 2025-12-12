import { isAnyOf } from '@reduxjs/toolkit';
import { AppStartListening } from '.';
import { add, remove, clearCart, addDiscount } from '../cartSlice';
import { saveCartToLocalStorage } from '../../utils/localStorageCart';

export default (startListening: AppStartListening) =>
  startListening({
    matcher: isAnyOf(add, remove, clearCart, addDiscount),
    effect: (_action, store) => {
      const newCartState = store.getState().cart;
      saveCartToLocalStorage(newCartState);
    },
  });
