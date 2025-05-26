import type { CartState } from '../redux/cartSlice';

const CART_STORAGE_KEY = 'rtkPersistedCart';

export const loadCartFromLocalStorage = () => {
  try {
    const serializedCartState = localStorage.getItem(CART_STORAGE_KEY);
    if (serializedCartState === null) {
      return undefined;
    }
    return JSON.parse(serializedCartState) as CartState;
  } catch (error) {
    console.warn('localStorageCart: Could not load cart state.', error);
    return undefined;
  }
};

export const saveCartToLocalStorage = (cartState: CartState) => {
  try {
    const serializedCartState = JSON.stringify(cartState);
    localStorage.setItem(CART_STORAGE_KEY, serializedCartState);
  } catch (error) {
    console.warn('localStorageCart: Could not save cart state.', error);
  }
};
