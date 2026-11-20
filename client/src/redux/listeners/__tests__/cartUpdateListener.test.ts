import { configureStore, createListenerMiddleware, type Middleware } from '@reduxjs/toolkit';
import type { ProductType } from 'shared-ts';
import type { AppStartListening } from '..';
import cartUpdateListener from '../cartUpdateListener';
import { add, cartReducer, updateQuantity } from '../../cartSlice';
import { saveCartToLocalStorage } from '../../../utils/localStorageCart';

// The listeners index imports the API services: register this listener on its own.
jest.mock('..', () => ({}));
jest.mock('../../../utils/localStorageCart', () => ({
  saveCartToLocalStorage: jest.fn(),
}));

const cola: ProductType = { id: 1, name: 'Cola', price: 2, categoryId: 1 };

describe('cartUpdateListener', () => {
  it('saves the cart when a quantity changes (the "Annuler" toast relies on it)', () => {
    const listener = createListenerMiddleware();
    cartUpdateListener(listener.startListening as unknown as AppStartListening);
    const store = configureStore({
      reducer: { cart: cartReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(listener.middleware as Middleware),
    });
    store.dispatch(add(cola));
    (saveCartToLocalStorage as jest.Mock).mockClear();

    store.dispatch(updateQuantity({ productId: 1, amount: 1 }));

    expect(saveCartToLocalStorage).toHaveBeenCalledWith({
      items: [{ product: cola, quantity: 2, discountedAmount: 0 }],
    });
  });
});
