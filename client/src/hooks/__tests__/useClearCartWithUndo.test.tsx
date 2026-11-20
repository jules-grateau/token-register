import React from 'react';
import { act, fireEvent, renderHook, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { toast } from 'react-toastify';
import type { ProductType } from 'shared-ts';
import { add, addDiscount, cartReducer } from '../../redux/cartSlice';
import { CART_CLEARED_TOAST_ID, useClearCartWithUndo } from '../useClearCartWithUndo';
import { render } from '../../utils/testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-toastify', () => ({
  toast: { info: jest.fn(), isActive: jest.fn(() => false), update: jest.fn(), dismiss: jest.fn() },
}));

const cola: ProductType = { id: 1, name: 'Cola', price: 2, categoryId: 1 };
const chips: ProductType = { id: 2, name: 'Chips', price: 3, categoryId: 1 };
const water: ProductType = { id: 3, name: 'Water', price: 1, categoryId: 1 };

function setup() {
  const store = configureStore({ reducer: { cart: cartReducer } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <MantineProvider>{children}</MantineProvider>
    </Provider>
  );
  const { result } = renderHook(() => useClearCartWithUndo(), { wrapper });
  return { store, clear: () => act(() => result.current()) };
}

/** Renders the content passed to toast.info and clicks its "Annuler" button. */
function clickUndo(store: ReturnType<typeof setup>['store']) {
  const content = (toast.info as jest.Mock).mock.calls.at(-1)[0] as React.ReactElement;
  render(<Provider store={store}>{content}</Provider>);
  fireEvent.click(screen.getByRole('button', { name: 'undo' }));
}

describe('useClearCartWithUndo (D-019)', () => {
  afterEach(() => jest.clearAllMocks());

  it('empties the cart at once and offers "Annuler" for 5 s', () => {
    const { store, clear } = setup();
    store.dispatch(add(cola));
    clear();

    expect(store.getState().cart.items).toEqual([]);
    expect(toast.info).toHaveBeenCalledWith(expect.anything(), {
      toastId: CART_CLEARED_TOAST_ID,
      autoClose: 5000,
      closeOnClick: false,
      pauseOnHover: true,
    });
  });

  it('"Annuler" restores the previous cart, discounts included, and closes the toast', () => {
    const { store, clear } = setup();
    store.dispatch(add(cola));
    store.dispatch(add(cola));
    store.dispatch(addDiscount({ productId: 1, discountedAmount: 1 }));
    clear();
    clickUndo(store);

    expect(store.getState().cart.items).toEqual([
      { product: cola, quantity: 2, discountedAmount: 1 },
    ]);
    expect(toast.dismiss).toHaveBeenCalledWith(CART_CLEARED_TOAST_ID);
  });

  it('"Annuler" merges: products added in the meantime are kept, quantities added', () => {
    const { store, clear } = setup();
    store.dispatch(add(cola));
    store.dispatch(add(chips));
    clear();
    store.dispatch(add(water));
    store.dispatch(add(chips));
    clickUndo(store);

    expect(store.getState().cart.items.map((item) => [item.product.name, item.quantity])).toEqual([
      ['Cola', 1],
      ['Chips', 2],
      ['Water', 1],
    ]);
  });

  it('does nothing on an empty cart', () => {
    const { clear } = setup();
    clear();
    expect(toast.info).not.toHaveBeenCalled();
  });
});
