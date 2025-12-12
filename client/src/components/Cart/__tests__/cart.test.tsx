import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Cart from '../index';
import { useSelector } from 'react-redux';
import { render } from '../../../utils/testUtils';
import { clearCart, updateQuantity } from '../../../redux/cartSlice';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => mockDispatch,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => (opts?.count ? `${key} (${opts.count})` : key),
  }),
}));

const mockCartItems = [
  {
    product: { id: 1, name: 'Apple', price: 2 },
    quantity: 3,
    discountedAmount: 0,
  },
];

describe('Cart', () => {
  const onClickHistory = jest.fn();
  const onValidateCart = jest.fn();

  beforeEach(() => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectCartItems') return mockCartItems;
      if (selector.name === 'selectTotalPrice') return 6;
      if (selector.name === 'selectTotalItems') return 3;
      return undefined;
    });
  });

  afterEach(() => {
    mockDispatch.mockClear();
  });

  it('renders history button', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
  });

  it('renders cart items', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByTestId('cart-total-item')).toHaveTextContent('3');
    expect(screen.getByTestId('item-total-price')).toHaveTextContent('6');
  });

  it('calls onClickHistory when history button is clicked', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    fireEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(onClickHistory).toHaveBeenCalled();
  });

  it('calls onValidateCart when checkout button is clicked', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    fireEvent.click(screen.getByRole('button', { name: /checkout/i }));
    expect(onValidateCart).toHaveBeenCalled();
  });

  it('shows empty cart message if cart is empty', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectCartItems') return [];
      if (selector.name === 'selectTotalPrice') return 0;
      if (selector.name === 'selectTotalItems') return 0;
      return undefined;
    });
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    expect(screen.getByText('your_cart_is_empty')).toBeInTheDocument();
  });

  it('dispatches updateQuantity with +1 when increment is clicked', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    const incrementButton = screen.getByRole('button', { name: /plus/i });
    fireEvent.click(incrementButton);
    expect(mockDispatch).toHaveBeenCalledWith(updateQuantity({ productId: 1, amount: 1 }));
  });

  it('dispatches updateQuantity with -1 when decrement is clicked', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    const decrementButton = screen.getByRole('button', { name: /minus/i });
    fireEvent.click(decrementButton);
    expect(mockDispatch).toHaveBeenCalledWith(updateQuantity({ productId: 1, amount: -1 }));
  });

  it('dispatches clearCart when "Clear cart" button is clicked', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    const clearButton = screen.getByRole('button', { name: /clear_cart/i });
    fireEvent.click(clearButton);
    expect(mockDispatch).toHaveBeenCalledWith(clearCart());
  });
});
