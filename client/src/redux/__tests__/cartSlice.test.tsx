import { selectCartItems, selectTotalPrice, selectTotalItems } from '../cartSlice';

describe('cartSlice selectors', () => {
  const mockState = {
    cart: {
      items: [
        {
          product: { id: 1, name: 'Apple', price: 10, categoryId: 1 },
          quantity: 2,
          discountedAmount: 0,
        },
        {
          product: { id: 2, name: 'Banana', price: 5, categoryId: 1 },
          quantity: 3,
          discountedAmount: 2,
        },
      ],
    },
  };

  it('selectCartItems returns all items', () => {
    expect(selectCartItems(mockState)).toEqual(mockState.cart.items);
  });

  it('selectTotalPrice returns the correct total', () => {
    // (10 * 2 - 0) + (5 * 3 - 2) = 20 + 13 = 33
    expect(selectTotalPrice(mockState)).toBe(33);
  });

  it('selectTotalItems returns the correct total quantity', () => {
    expect(selectTotalItems(mockState)).toBe(5);
  });

  it('returns 0 for total price and items if cart is empty', () => {
    const emptyState = { cart: { items: [] } };
    expect(selectTotalPrice(emptyState)).toBe(0);
    expect(selectTotalItems(emptyState)).toBe(0);
  });
});
