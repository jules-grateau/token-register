import { loadCartFromLocalStorage, saveCartToLocalStorage } from '../localStorageCart';
import type { CartState } from '../../redux/cartSlice';
const CART_STORAGE_KEY = 'rtkPersistedCart';

describe('localStorageCart', () => {
  const mockCartState: CartState = {
    items: [
      {
        product: { id: 1, name: 'Apple', price: 10, categoryId: 1 },
        quantity: 2,
        discountedAmount: 0,
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads cart state from localStorage', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mockCartState));
    expect(loadCartFromLocalStorage()).toEqual(mockCartState);
  });

  it('returns undefined if nothing in localStorage', () => {
    expect(loadCartFromLocalStorage()).toBeUndefined();
  });

  it('returns undefined and warns if JSON is invalid', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{invalid json}');
    expect(loadCartFromLocalStorage()).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      'localStorageCart: Could not load cart state.',
      expect.any(SyntaxError)
    );
  });

  it('saves cart state to localStorage', () => {
    saveCartToLocalStorage(mockCartState);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBe(JSON.stringify(mockCartState));
  });
});
