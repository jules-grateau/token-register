import {
  cartReducer,
  add,
  updateQuantity,
  remove,
  clearCart,
  addDiscount,
  restoreCart,
} from '../cartSlice';
import type { CartState } from '../cartSlice';
import type { ProductType } from 'shared-ts';

const product1: ProductType = { id: 1, name: 'Apple', price: 10, categoryId: 1 };
const product2: ProductType = { id: 2, name: 'Banana', price: 5, categoryId: 1 };

describe('cartSlice reducers', () => {
  let initialState: CartState;

  beforeEach(() => {
    initialState = {
      items: [
        { product: product1, quantity: 1, discountedAmount: 0 },
        { product: product2, quantity: 2, discountedAmount: 0 },
      ],
    };
  });

  it('should handle initial state', () => {
    expect(cartReducer(undefined, { type: 'unknown' })).toEqual({ items: [] });
  });

  it('should handle add to cart', () => {
    const state = { items: [] };
    const nextState = cartReducer(state, add(product1));
    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0].product).toEqual(product1);
    expect(nextState.items[0].quantity).toBe(1);
  });

  it('should increment quantity if product already in cart', () => {
    const nextState = cartReducer(initialState, add(product1));
    expect(nextState.items[0].quantity).toBe(2);
  });

  it('should handle updateQuantity (increment)', () => {
    const action = updateQuantity({ productId: 1, amount: 1 });
    const nextState = cartReducer(initialState, action);
    expect(nextState.items[0].quantity).toBe(2);
  });

  it('should handle updateQuantity (decrement)', () => {
    const action = updateQuantity({ productId: 2, amount: -1 });
    const nextState = cartReducer(initialState, action);
    expect(nextState.items[1].quantity).toBe(1);
  });

  it('removes the line with its discount when "−" is pressed at 1 (D-062)', () => {
    const state = cartReducer(initialState, addDiscount({ productId: 1, discountedAmount: 5 }));
    const nextState = cartReducer(state, updateQuantity({ productId: 1, amount: -1 }));
    expect(nextState.items).toEqual([{ product: product2, quantity: 2, discountedAmount: 0 }]);
  });

  it('removes the line when the quantity would go below 0 (D-062)', () => {
    const nextState = cartReducer(initialState, updateQuantity({ productId: 1, amount: -2 }));
    expect(nextState.items.map((item) => item.product.id)).toEqual([2]);
  });

  it('ignores a non-integer quantity change', () => {
    const nextState = cartReducer(initialState, updateQuantity({ productId: 2, amount: -0.5 }));
    expect(nextState).toEqual(initialState);
  });

  it('ignores an unknown product', () => {
    const nextState = cartReducer(initialState, updateQuantity({ productId: 99, amount: -1 }));
    expect(nextState).toEqual(initialState);
  });

  it('should handle remove', () => {
    const nextState = cartReducer(initialState, remove(0)); // remove first item
    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0].product.id).toBe(2);
  });

  it('should handle clear', () => {
    const nextState = cartReducer(initialState, clearCart());
    expect(nextState.items).toHaveLength(0);
  });

  it('should handle addDiscount', () => {
    const nextState = cartReducer(initialState, addDiscount({ productId: 1, discountedAmount: 5 }));
    expect(nextState.items[0].discountedAmount).toBe(5);
  });
});

describe('cartSlice restore (D-019: "Annuler" merges)', () => {
  const product3: ProductType = { id: 3, name: 'Cherry', price: 2, categoryId: 1 };
  const previous = [
    { product: product1, quantity: 1, discountedAmount: 0 },
    { product: product2, quantity: 2, discountedAmount: 0 },
  ];

  it('brings the previous cart back into an empty cart', () => {
    const nextState = cartReducer({ items: [] }, restoreCart(previous));
    expect(nextState.items).toEqual(previous);
  });

  it('keeps the products added in the meantime, after the previous lines', () => {
    const current = { items: [{ product: product3, quantity: 1, discountedAmount: 0 }] };
    const nextState = cartReducer(current, restoreCart(previous));
    expect(nextState.items.map((item) => [item.product.id, item.quantity])).toEqual([
      [1, 1],
      [2, 2],
      [3, 1],
    ]);
  });

  it('adds the quantities of a product present in both carts', () => {
    const current = { items: [{ product: product2, quantity: 1, discountedAmount: 0 }] };
    const nextState = cartReducer(current, restoreCart(previous));
    expect(nextState.items).toHaveLength(2);
    expect(nextState.items[1]).toEqual({ product: product2, quantity: 3, discountedAmount: 0 });
  });

  it('keeps the discounts of lines that are only in one cart', () => {
    const current = { items: [{ product: product3, quantity: 1, discountedAmount: 1 }] };
    const nextState = cartReducer(
      current,
      restoreCart([{ product: product1, quantity: 2, discountedAmount: 5 }])
    );
    expect(nextState.items.map((item) => item.discountedAmount)).toEqual([5, 1]);
  });

  it('adds quantities and discount amounts of a product in both carts (D-024)', () => {
    // 2 x Apple (-1), emptied, 1 x Apple (-0.50), "Annuler" -> 3 x Apple (-1.50).
    const current = { items: [{ product: product1, quantity: 1, discountedAmount: 50 }] };
    const nextState = cartReducer(
      current,
      restoreCart([{ product: product1, quantity: 2, discountedAmount: 100 }])
    );
    expect(nextState.items).toEqual([{ product: product1, quantity: 3, discountedAmount: 150 }]);
  });
});
