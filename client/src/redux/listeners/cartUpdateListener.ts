import { isAnyOf } from '@reduxjs/toolkit';
import { AppStartListening } from '.';
import { add, remove, clear, addDiscount } from '../cartSlice';
import { saveCartToLocalStorage } from '../../utils/localStorageCart';

export default (startListening: AppStartListening) =>
  startListening({
    matcher: isAnyOf(add, remove, clear, addDiscount),
    effect: (_action, store) => {
      const newCartState = store.getState().cart;
      saveCartToLocalStorage(newCartState);
    },
  });
