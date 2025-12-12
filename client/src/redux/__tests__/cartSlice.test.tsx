import { cartReducer, add, updateQuantity, remove, clear, addDiscount } from '../cartSlice';
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

  it('should not let quantity go below 0', () => {
    const action = updateQuantity({ productId: 1, amount: -2 });
    const nextState = cartReducer(initialState, action);
    expect(nextState.items[0].quantity).toBe(1);
  });

  it('should handle remove', () => {
    const nextState = cartReducer(initialState, remove(0)); // remove first item
    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0].product.id).toBe(2);
  });

  it('should handle clear', () => {
    const nextState = cartReducer(initialState, clear());
    expect(nextState.items).toHaveLength(0);
  });

  it('should handle addDiscount', () => {
    const nextState = cartReducer(initialState, addDiscount({ productId: 1, discountedAmount: 5 }));
    expect(nextState.items[0].discountedAmount).toBe(5);
  });
});
