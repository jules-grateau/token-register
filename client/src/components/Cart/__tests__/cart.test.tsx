import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Cart from '../index';
import { useSelector } from 'react-redux';
import { render } from '../../../utils/testUtils';
import { clearCart, updateQuantity } from '../../../redux/cartSlice';
import { toast } from 'react-toastify';
import { resetLayoutMode, setLayoutMode } from '../../../test/layoutMode';

const mockDispatch = jest.fn();

let mockStoreItems: unknown[] = [];

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => mockDispatch,
  useStore: () => ({ getState: () => ({ cart: { items: mockStoreItems } }) }),
}));

jest.mock('react-toastify', () => ({
  toast: { info: jest.fn(), isActive: jest.fn(() => false), update: jest.fn(), dismiss: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => (opts?.count ? `${key} (${opts.count})` : key),
  }),
}));

// D-061: an open cash day by default; tests of the banner set it to "none".
let mockNoCashDay = false;
const mockStartCashDay = jest.fn();
jest.mock('../../../hooks/useCashDay', () => ({
  useCurrentCashDay: () => ({
    cashDay: null,
    isNone: mockNoCashDay,
    isKnown: true,
    refetch: jest.fn(),
  }),
  useStartCashDay: () => ({ start: mockStartCashDay, isLoading: false }),
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
    mockStoreItems = mockCartItems;
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

  it('keeps "−" enabled at quantity 1: it removes the line (D-062)', () => {
    const single = [{ ...mockCartItems[0], quantity: 1 }];
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectCartItems') return single;
      if (selector.name === 'selectTotalPrice') return 2;
      if (selector.name === 'selectTotalItems') return 1;
      return undefined;
    });
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    const decrementButton = screen.getByRole('button', { name: /minus/i });
    expect(decrementButton).toBeEnabled();
    fireEvent.click(decrementButton);
    expect(mockDispatch).toHaveBeenCalledWith(updateQuantity({ productId: 1, amount: -1 }));
  });

  it('dispatches clearCart when "Clear cart" button is clicked', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    const clearButton = screen.getByRole('button', { name: /clear_cart/i });
    fireEvent.click(clearButton);
    expect(mockDispatch).toHaveBeenCalledWith(clearCart());
    // D-019: the cart is emptied at once and "Annuler" is offered in a toast.
    expect(toast.info).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toastId: 'cart-cleared', autoClose: 5000, closeOnClick: false })
    );
  });

  it('gives each cart line a "more actions" menu with an accessible name', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    expect(screen.getByRole('button', { name: 'cart_item_actions' })).toBeInTheDocument();
  });
});

describe('Cart on a phone in portrait', () => {
  const onClickHistory = jest.fn();
  const onValidateCart = jest.fn();

  beforeEach(() => {
    setLayoutMode('phone-portrait');
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectCartItems') return mockCartItems;
      if (selector.name === 'selectTotalPrice') return 6;
      if (selector.name === 'selectTotalItems') return 3;
      return undefined;
    });
  });

  afterEach(() => {
    resetLayoutMode();
    jest.clearAllMocks();
  });

  it('shows a collapsed bar with the total and "Valider", without the lines', () => {
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    expect(screen.getByTestId('cart-bar')).toBeInTheDocument();
    expect(screen.getByTestId('cart-bar-total')).toHaveTextContent('6');
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /checkout/i }));
    expect(onValidateCart).toHaveBeenCalled();
  });

  it('asks to open the Drawer when the bar is touched', () => {
    const onDrawerOpenChange = jest.fn();
    render(
      <Cart
        onClickHistory={onClickHistory}
        onValidateCart={onValidateCart}
        onDrawerOpenChange={onDrawerOpenChange}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'view_cart' })[0]);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
  });

  it('shows the lines and the clear button in the open Drawer', async () => {
    render(
      <Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} isDrawerOpen={true} />
    );
    expect(await screen.findByText('Apple')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear_cart/i })).toBeInTheDocument();
    // History moves to the global header on phones.
    expect(screen.queryByRole('button', { name: /history/i })).not.toBeInTheDocument();
  });

  it('disables "Valider" when the cart is empty', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectCartItems') return [];
      return 0;
    });
    render(<Cart onClickHistory={onClickHistory} onValidateCart={onValidateCart} />);
    expect(screen.getByRole('button', { name: /checkout/i })).toBeDisabled();
    expect(screen.getByText('cart_empty_short')).toBeInTheDocument();
  });
});

describe('Cart without an open cash day (D-061, answer 19 a)', () => {
  beforeEach(() => {
    mockNoCashDay = true;
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectCartItems') return mockCartItems;
      if (selector.name === 'selectTotalPrice') return 6;
      if (selector.name === 'selectTotalItems') return 3;
      return undefined;
    });
  });

  afterEach(() => {
    mockNoCashDay = false;
    resetLayoutMode();
  });

  it.each(['desktop', 'phone-landscape', 'phone-portrait'] as const)(
    'disables "Valider" and shows the banner that starts the day (%s)',
    (mode) => {
      setLayoutMode(mode);
      render(<Cart onClickHistory={jest.fn()} onValidateCart={jest.fn()} />);
      expect(screen.getByTestId('no-cash-day-banner')).toHaveTextContent('cash_day.indicator_none');
      for (const button of screen.getAllByRole('button', { name: /checkout/i })) {
        expect(button).toBeDisabled();
      }
      fireEvent.click(screen.getByRole('button', { name: 'cash_day.start' }));
      expect(mockStartCashDay).toHaveBeenCalled();
    }
  );

  it('has no banner when a day is open', () => {
    mockNoCashDay = false;
    render(<Cart onClickHistory={jest.fn()} onValidateCart={jest.fn()} />);
    expect(screen.queryByTestId('no-cash-day-banner')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /checkout/i })).toBeEnabled();
  });
});
