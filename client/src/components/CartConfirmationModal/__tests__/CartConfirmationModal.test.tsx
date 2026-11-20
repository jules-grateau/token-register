import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import CartConfirmationModal from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { useAddOrderMutation, useGetOrdersQuery } from '../../../services/orders';
import { toast } from 'react-toastify';
import { clearCart } from '../../../redux/cartSlice';
import { render } from '../../../utils/testUtils';
import type { CreateOrderRequestType } from 'shared-ts';
import { useLayoutMode } from '../../../hooks/useLayoutMode';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      key === 'order_line'
        ? `${opts.quantity} × ${opts.name}`
        : opts
          ? `${key} (${JSON.stringify(opts)})`
          : key,
  }),
}));

jest.mock('../../../services/orders', () => ({
  useAddOrderMutation: jest.fn(),
  useGetOrdersQuery: jest.fn(),
}));

jest.mock('../../../hooks/useLayoutMode', () => ({
  ...jest.requireActual<object>('../../../hooks/useLayoutMode'),
  useLayoutMode: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const mockDispatch = jest.fn();
const mockAddOrder = jest.fn();
const mockRefetchOrders = jest.fn();

const mockCartItems = [
  { product: { id: 1, name: 'Product A', price: 250 }, quantity: 2, discountedAmount: 0 },
  { product: { id: 2, name: 'Product B', price: 250 }, quantity: 1, discountedAmount: 0 },
];

let mockTotal = 750;

const setCurrency = (currency?: 'EUR') => {
  window.APP_CONFIG = currency ? { VITE_CURRENCY: currency } : undefined;
};

const renderModal = (onClose = jest.fn()) =>
  render(<CartConfirmationModal isOpen={true} onClose={onClose} />);

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const press = (...keys: string[]) => keys.forEach((key) => fireEvent.click(button(key)));
const changeDisplay = () => screen.getByTestId('change-display');
const savedOrder = () => mockAddOrder.mock.calls[0][0] as CreateOrderRequestType;

describe('CartConfirmationModal (Encaissement)', () => {
  beforeEach(() => {
    mockTotal = 750;
    setCurrency('EUR');
    (useLayoutMode as jest.Mock).mockReturnValue('tablet');
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectCartItems') return mockCartItems;
      if (selector.name === 'selectTotalPrice') return mockTotal;
      if (selector.name === 'selectTotalItems') return 3;
      return undefined;
    });
    mockAddOrder.mockReturnValue({ unwrap: () => Promise.resolve(12) });
    (useAddOrderMutation as jest.Mock).mockReturnValue([mockAddOrder, { isLoading: false }]);
    (useGetOrdersQuery as jest.Mock).mockReturnValue({ refetch: mockRefetchOrders });
  });

  afterEach(() => {
    jest.clearAllMocks();
    setCurrency();
  });

  it('does not render when isOpen is false', () => {
    render(<CartConfirmationModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByText('cart_confirmation')).not.toBeInTheDocument();
  });

  it('shows the recap with quantities (D-026) and an empty change block', () => {
    renderModal();
    expect(screen.getByText('cart_confirmation')).toBeInTheDocument();
    expect(screen.getByText('2 × Product A')).toBeInTheDocument();
    expect(screen.getByText('1 × Product B')).toBeInTheDocument();
    expect(changeDisplay()).toHaveTextContent('payment_placeholder');
    expect(button('payment_collect')).toBeDisabled();
  });

  describe('euros', () => {
    it('saves a card payment at once (D-028)', async () => {
      renderModal();
      fireEvent.click(button('payment_card'));

      await waitFor(() => {
        expect(mockAddOrder).toHaveBeenCalledWith({
          items: mockCartItems,
          payment: { cashAmount: null, cardAmount: 750 },
        });
      });
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(clearCart());
        expect(toast.success).toHaveBeenCalledWith(
          `order_placed_with_payment (${JSON.stringify({ id: 12, payment: 'payment_card' })})`
        );
      });
      // D-025: placing an order closes the "Panier vidé – Annuler" toast.
      expect(toast.dismiss).toHaveBeenCalledWith('cart-cleared');
      expect(mockRefetchOrders).toHaveBeenCalledTimes(1);
    });

    it('saves the exact amount in cash at once', async () => {
      renderModal();
      fireEvent.click(button(/^payment_exact_aria/));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: 750, cardAmount: null });
      });
    });

    it('shows the change of a suggested note, then saves on "Encaisser" (D-029)', async () => {
      renderModal();
      expect(screen.getAllByRole('button', { name: /^payment_received_aria/ })).toHaveLength(4);

      const twenty = button(/payment_received_aria.*20,00/);
      fireEvent.click(twenty);

      expect(twenty).toHaveAttribute('aria-pressed', 'true');
      expect(changeDisplay()).toHaveTextContent('payment_change_due');
      expect(changeDisplay()).toHaveTextContent(/12,50/);
      expect(mockAddOrder).not.toHaveBeenCalled();
      // A cash amount turns "Carte" into "Tout en carte".
      expect(button(/^payment_all_card/)).toBeInTheDocument();

      fireEvent.click(button('payment_collect'));
      await waitFor(() => {
        // The change is never recorded (D-034).
        expect(savedOrder().payment).toEqual({ cashAmount: 750, cardAmount: null });
      });
    });

    it('waits for "Encaisser" when the typed amount equals the total', () => {
      renderModal();
      press('7');
      expect(changeDisplay()).toHaveTextContent('payment_remaining');
      press(',', '5');
      expect(changeDisplay()).toHaveTextContent('payment_no_change');
      expect(mockAddOrder).not.toHaveBeenCalled();
    });

    it('splits a partial cash payment, the rest by card (D-031)', async () => {
      renderModal();
      press('5');
      expect(changeDisplay()).toHaveTextContent('payment_remaining');
      expect(changeDisplay()).toHaveTextContent(/2,50/);

      fireEvent.click(button(/^payment_rest_by_card/));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: 500, cardAmount: 250 });
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          `order_placed_with_payment (${JSON.stringify({ id: 12, payment: 'payment_cash_and_card' })})`
        );
      });
    });

    it('"Tout en carte" ignores the typed amount', async () => {
      renderModal();
      press('5');
      fireEvent.click(button(/^payment_all_card/));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: null, cardAmount: 750 });
      });
    });

    it('typing after a suggestion starts a new amount, and ✕ clears it', () => {
      renderModal();
      fireEvent.click(button(/payment_received_aria.*20,00/));
      press('5');
      expect(screen.getByTestId('typed-amount')).toHaveTextContent(/^5/);
      fireEvent.click(button('payment_clear_amount'));
      expect(changeDisplay()).toHaveTextContent('payment_placeholder');
    });

    it('warns about a large change without blocking', () => {
      renderModal();
      press('2', '0', '0');
      expect(changeDisplay()).toHaveTextContent('payment_large_change');
      expect(button('payment_collect')).toBeEnabled();
    });

    it('supports the physical keyboard: digits, then Enter on the main button', async () => {
      renderModal();
      const display = screen.getByTestId('typed-amount');
      fireEvent.keyDown(display, { key: '1' });
      fireEvent.keyDown(display, { key: '0' });
      expect(changeDisplay()).toHaveTextContent('payment_change_due');
      fireEvent.keyDown(display, { key: 'Enter' });
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: 750, cardAmount: null });
      });
    });

    it('asks for the mode on a negative total, without keypad (D-032)', async () => {
      mockTotal = -200;
      renderModal();
      expect(changeDisplay()).toHaveTextContent('payment_refund_due');
      expect(screen.queryByRole('button', { name: 'payment_collect' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '7' })).not.toBeInTheDocument();

      fireEvent.click(button('payment_cash'));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: -200, cardAmount: null });
      });
    });

    it('shows "Rien à encaisser" on a zero total and records the chosen mode', async () => {
      mockTotal = 0;
      renderModal();
      expect(changeDisplay()).toHaveTextContent('payment_nothing_due');
      fireEvent.click(button('payment_card'));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: null, cardAmount: 0 });
      });
    });

    it('opens the keypad view on phone portrait with "Autre montant"', () => {
      (useLayoutMode as jest.Mock).mockReturnValue('phone-portrait');
      renderModal();
      expect(screen.queryByRole('button', { name: '7' })).not.toBeInTheDocument();
      fireEvent.click(button('payment_other_amount'));
      expect(button('7')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'payment_card' })).not.toBeInTheDocument();
      fireEvent.click(button('payment_back_to_amounts'));
      expect(button('payment_card')).toBeInTheDocument();
    });
  });

  describe('tokens (D-033)', () => {
    beforeEach(() => {
      setCurrency();
      mockTotal = 7;
    });

    it('has no card button and records no payment', async () => {
      renderModal();
      expect(screen.queryByRole('button', { name: 'payment_card' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: ',' })).not.toBeInTheDocument();

      fireEvent.click(button(/^payment_exact_aria/));
      await waitFor(() => {
        expect(mockAddOrder).toHaveBeenCalledWith({ items: mockCartItems, payment: null });
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(`order_placed (${JSON.stringify({ id: 12 })})`);
      });
    });

    it('shows the tokens to return', () => {
      renderModal();
      press('1', '0');
      expect(changeDisplay()).toHaveTextContent('payment_tokens_change_due');
    });

    it('blocks "Encaisser" when tokens are missing', () => {
      renderModal();
      press('5');
      expect(changeDisplay()).toHaveTextContent('payment_missing');
      expect(button('payment_collect')).toBeDisabled();
    });

    it('saves a negative total with "Enregistrer"', async () => {
      mockTotal = -3;
      renderModal();
      expect(changeDisplay()).toHaveTextContent('payment_tokens_refund_due');
      fireEvent.click(button('payment_save'));
      await waitFor(() => {
        expect(mockAddOrder).toHaveBeenCalledWith({ items: mockCartItems, payment: null });
      });
    });
  });

  it('keeps the modal open and the typed amount on an API error', async () => {
    const error = new Error('Network Error');
    mockAddOrder.mockReturnValue({ unwrap: () => Promise.reject(error) });
    const onClose = jest.fn();
    renderModal(onClose);
    press('5');
    fireEvent.click(button(/^payment_rest_by_card/));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        `error_adding_order (${JSON.stringify({ error: String(error) })})`,
        { autoClose: 5000 }
      );
    });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(changeDisplay()).toHaveTextContent('payment_remaining');
  });

  it('disables every action while saving', () => {
    (useAddOrderMutation as jest.Mock).mockReturnValue([mockAddOrder, { isLoading: true }]);
    renderModal();
    fireEvent.click(button('payment_card'));
    fireEvent.click(button('7'));
    expect(mockAddOrder).not.toHaveBeenCalled();
    expect(button('7')).toBeDisabled();
  });
});
