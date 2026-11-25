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
import { dismissSuccessToasts } from '../../../utils/toasts';

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

jest.mock('../../../utils/toasts', () => ({
  dismissSuccessToasts: jest.fn(),
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

  it('shows the recap with quantities (D-026), then asks for the mode first (D-053)', () => {
    renderModal();
    expect(screen.getByText('cart_confirmation')).toBeInTheDocument();
    expect(screen.getByText('2 × Product A')).toBeInTheDocument();
    expect(screen.getByText('1 × Product B')).toBeInTheDocument();
    expect(changeDisplay()).toHaveTextContent('payment_placeholder_mode');
    expect(changeDisplay()).toHaveAttribute('data-state', 'empty');
    expect(button('payment_cash')).toBeInTheDocument();
    expect(button('payment_card')).toBeInTheDocument();
    // No amount before a mode is chosen, and no "Appoint" button any more.
    expect(screen.queryByRole('button', { name: '7' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^payment_exact/ })).not.toBeInTheDocument();
    expect(button('payment_collect')).toBeDisabled();
  });

  describe('euros, card', () => {
    it('prefills the amount due, then saves on "Encaisser"', async () => {
      renderModal();
      fireEvent.click(button('payment_card'));
      expect(button('payment_card')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('typed-amount')).toHaveTextContent(/^7,50/);
      expect(changeDisplay()).toHaveAttribute('data-state', 'paid');
      expect(mockAddOrder).not.toHaveBeenCalled();

      fireEvent.click(button('payment_collect'));
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

    it('never goes above the amount due', () => {
      renderModal();
      fireEvent.click(button('payment_card'));
      press('9'); // 9 EUR > 7,50 EUR: ignored, the prefilled amount stays
      expect(screen.getByTestId('typed-amount')).toHaveTextContent(/^7,50/);
      press('5');
      expect(screen.getByTestId('typed-amount')).toHaveTextContent(/^5/);
      press('0');
      expect(screen.getByTestId('typed-amount')).toHaveTextContent(/^5/);
    });

    it('adds a partial card part, then the cash is prefilled with the rest', async () => {
      renderModal();
      fireEvent.click(button('payment_card'));
      press('5');
      expect(changeDisplay()).toHaveAttribute('data-state', 'remaining');
      fireEvent.click(button('payment_add_part'));

      expect(screen.getByTestId('payment-parts')).toHaveTextContent('payment_card');
      expect(changeDisplay()).toHaveAttribute('data-state', 'due');
      expect(changeDisplay()).toHaveTextContent(/2,50/);
      expect(button('payment_card')).toBeDisabled();

      fireEvent.click(button('payment_cash'));
      // The exact amount due is the first suggestion, and it is selected.
      const suggestions = screen.getAllByRole('button', { name: /^payment_received_aria/ });
      expect(suggestions).toHaveLength(4);
      expect(suggestions[0]).toHaveAccessibleName(/2,50/);
      expect(suggestions[0]).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(button(/payment_received_aria.*5,00/));
      expect(changeDisplay()).toHaveAttribute('data-state', 'change');
      fireEvent.click(button('payment_collect'));
      await waitFor(() => {
        // The change is never recorded (D-034).
        expect(savedOrder().payment).toEqual({ cashAmount: 250, cardAmount: 500 });
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          `order_placed_with_payment (${JSON.stringify({ id: 12, payment: 'payment_cash_and_card' })})`
        );
      });
    });
  });

  describe('euros, cash', () => {
    it('suggests the exact amount first, fills it, then saves on "Encaisser"', async () => {
      renderModal();
      fireEvent.click(button('payment_cash'));
      expect(changeDisplay()).toHaveTextContent('payment_placeholder_cash');
      const suggestions = screen.getAllByRole('button', { name: /^payment_received_aria/ });
      expect(suggestions.map((s) => s.textContent)).toEqual([
        expect.stringMatching(/7,50/),
        '8\u00a0€',
        '10\u00a0€',
        '20\u00a0€',
      ]);

      fireEvent.click(suggestions[0]);
      expect(changeDisplay()).toHaveAttribute('data-state', 'no-change');
      expect(mockAddOrder).not.toHaveBeenCalled();
      fireEvent.click(button('payment_collect'));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: 750, cardAmount: null });
      });
    });

    it('shows the change of a suggested note, then saves on "Encaisser" (D-029)', async () => {
      renderModal();
      fireEvent.click(button('payment_cash'));
      const twenty = button(/payment_received_aria.*20,00/);
      fireEvent.click(twenty);
      expect(twenty).toHaveAttribute('aria-pressed', 'true');
      expect(changeDisplay()).toHaveTextContent('payment_change_due');
      expect(changeDisplay()).toHaveTextContent(/12,50/);

      fireEvent.click(button('payment_collect'));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: 750, cardAmount: null });
      });
    });

    it('adds a partial cash part, then the card is prefilled with the rest', async () => {
      renderModal();
      fireEvent.click(button('payment_cash'));
      press('5');
      expect(changeDisplay()).toHaveTextContent('payment_remaining');
      fireEvent.click(button('payment_add_part'));

      fireEvent.click(button('payment_card'));
      expect(screen.getByTestId('typed-amount')).toHaveTextContent(/^2,50/);
      fireEvent.click(button('payment_collect'));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: 500, cardAmount: 250 });
      });
    });

    it('removes a part while the other mode is open: back to the modes (TL-1)', () => {
      renderModal();
      fireEvent.click(button('payment_cash'));
      press('5');
      fireEvent.click(button('payment_add_part'));
      fireEvent.click(button('payment_card'));
      expect(screen.getByTestId('typed-amount')).toHaveTextContent(/^2,50/);

      fireEvent.click(button(/^payment_remove_part/));
      expect(screen.queryByTestId('typed-amount')).not.toBeInTheDocument();
      expect(button('payment_card')).toHaveAttribute('aria-pressed', 'false');
      expect(changeDisplay()).toHaveTextContent('payment_placeholder_mode');

      // The card is prefilled again, with the new amount due.
      fireEvent.click(button('payment_card'));
      expect(screen.getByTestId('typed-amount')).toHaveTextContent(/^7,50/);
      expect(button('payment_collect')).toBeEnabled();
    });

    it('removes a part: the amount due goes back up', () => {
      renderModal();
      fireEvent.click(button('payment_cash'));
      press('5');
      fireEvent.click(button('payment_add_part'));
      expect(button('payment_cash')).toBeDisabled();
      // DS-3: the disabled mode says why.
      expect(button('payment_cash').parentElement).toHaveAttribute(
        'title',
        'payment_mode_has_part'
      );

      fireEvent.click(button(/^payment_remove_part/));
      expect(screen.queryByTestId('payment-parts')).not.toBeInTheDocument();
      expect(button('payment_cash')).toBeEnabled();
      expect(changeDisplay()).toHaveTextContent('payment_placeholder_mode');
    });

    it('the last mode must cover the rest: no third part', () => {
      renderModal();
      fireEvent.click(button('payment_cash'));
      press('5');
      fireEvent.click(button('payment_add_part'));
      fireEvent.click(button('payment_card'));
      press('1');
      expect(changeDisplay()).toHaveTextContent('payment_must_cover');
      expect(screen.queryByRole('button', { name: 'payment_add_part' })).not.toBeInTheDocument();
      expect(button('payment_collect')).toBeDisabled();
    });

    it('typing after a suggestion starts a new amount, and the clear button empties it', () => {
      renderModal();
      fireEvent.click(button('payment_cash'));
      fireEvent.click(button(/payment_received_aria.*20,00/));
      press('5');
      expect(screen.getByTestId('typed-amount')).toHaveTextContent(/^5/);
      fireEvent.click(button('payment_clear_amount'));
      expect(changeDisplay()).toHaveTextContent('payment_placeholder_cash');
    });

    it('warns about a large change without blocking', () => {
      renderModal();
      fireEvent.click(button('payment_cash'));
      press('2', '0', '0');
      expect(changeDisplay()).toHaveTextContent('payment_large_change');
      expect(button('payment_collect')).toBeEnabled();
    });

    it('supports the physical keyboard: digits, then Enter on the main button', async () => {
      renderModal();
      fireEvent.click(button('payment_cash'));
      const display = screen.getByTestId('typed-amount');
      fireEvent.keyDown(display, { key: '1' });
      fireEvent.keyDown(display, { key: '0' });
      expect(changeDisplay()).toHaveTextContent('payment_change_due');
      fireEvent.keyDown(display, { key: 'Enter' });
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: 750, cardAmount: null });
      });
    });

    it('opens the keypad view on phone portrait with "Autre montant"', () => {
      (useLayoutMode as jest.Mock).mockReturnValue('phone-portrait');
      renderModal();
      fireEvent.click(button('payment_cash'));
      expect(screen.queryByRole('button', { name: '7' })).not.toBeInTheDocument();
      fireEvent.click(button('payment_other_amount'));
      expect(button('7')).toBeInTheDocument();
      fireEvent.click(button('payment_back_to_amounts'));
      expect(button('payment_card')).toBeInTheDocument();
    });

    it('keeps the mode row with the card keypad on phone portrait (DS-1)', () => {
      (useLayoutMode as jest.Mock).mockReturnValue('phone-portrait');
      renderModal();
      fireEvent.click(button('payment_card'));
      expect(button('7')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'payment_back_to_modes' })
      ).not.toBeInTheDocument();
      fireEvent.click(button('payment_cash'));
      expect(button('payment_cash')).toHaveAttribute('aria-pressed', 'true');
      expect(changeDisplay()).toHaveTextContent('payment_placeholder_cash');
    });

    it('goes back to the modes from the card keypad on phone landscape', () => {
      (useLayoutMode as jest.Mock).mockReturnValue('phone-landscape');
      renderModal();
      fireEvent.click(button('payment_card'));
      fireEvent.click(button('payment_back_to_modes'));
      expect(changeDisplay()).toHaveTextContent('payment_placeholder_mode');
    });
  });

  describe('euros, total <= 0 (D-053)', () => {
    it('asks for the mode, then refunds with "Rembourser"', async () => {
      mockTotal = -200;
      renderModal();
      expect(changeDisplay()).toHaveTextContent('payment_refund_due');
      expect(screen.queryByRole('button', { name: '7' })).not.toBeInTheDocument();
      expect(button('payment_refund')).toBeDisabled();

      fireEvent.click(button('payment_cash'));
      expect(mockAddOrder).not.toHaveBeenCalled();
      fireEvent.click(button('payment_refund'));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: -200, cardAmount: null });
      });
    });

    it('records the chosen mode on a zero total with "Encaisser"', async () => {
      mockTotal = 0;
      renderModal();
      expect(changeDisplay()).toHaveTextContent('payment_nothing_due');
      fireEvent.click(button('payment_card'));
      fireEvent.click(button('payment_collect'));
      await waitFor(() => {
        expect(savedOrder().payment).toEqual({ cashAmount: null, cardAmount: 0 });
      });
    });
  });

  describe('tokens (D-053)', () => {
    beforeEach(() => {
      setCurrency();
      mockTotal = 7;
    });

    it('shows the recap and "Encaisser" only, and records no payment', async () => {
      renderModal();
      expect(screen.queryByRole('button', { name: 'payment_cash' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'payment_card' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '7' })).not.toBeInTheDocument();
      expect(screen.queryByTestId('change-display')).not.toBeInTheDocument();
      expect(screen.queryAllByRole('button', { name: /^payment_received_aria/ })).toHaveLength(0);

      fireEvent.click(button('payment_collect'));
      await waitFor(() => {
        expect(mockAddOrder).toHaveBeenCalledWith({ items: mockCartItems, payment: null });
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(`order_placed (${JSON.stringify({ id: 12 })})`);
      });
    });

    it('saves a negative total with "Rembourser"', async () => {
      mockTotal = -3;
      renderModal();
      fireEvent.click(button('payment_refund'));
      await waitFor(() => {
        expect(mockAddOrder).toHaveBeenCalledWith({ items: mockCartItems, payment: null });
      });
    });

    it('saves a zero total with "Encaisser"', () => {
      mockTotal = 0;
      renderModal();
      expect(button('payment_collect')).toBeEnabled();
    });
  });

  it('keeps the modal open and the parts on an API error', async () => {
    const error = new Error('Network Error');
    mockAddOrder.mockReturnValue({ unwrap: () => Promise.reject(error) });
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.click(button('payment_cash'));
    press('5');
    fireEvent.click(button('payment_add_part'));
    fireEvent.click(button('payment_card'));
    fireEvent.click(button('payment_collect'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('error_adding_order', { autoClose: 5000 });
    });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('payment-parts')).toHaveTextContent('payment_cash');
    expect(changeDisplay()).toHaveAttribute('data-state', 'paid');
  });

  it('closes the success toast of the previous sale when it opens (DS-2)', () => {
    renderModal();
    expect(dismissSuccessToasts).toHaveBeenCalledTimes(1);
  });

  it('asks to reload the page when the API requires a payment (D-035)', async () => {
    mockAddOrder.mockReturnValue({
      unwrap: () =>
        Promise.reject(
          Object.assign(new Error('400'), { data: { error: 'x', code: 'PAYMENT_REQUIRED' } })
        ),
    });
    renderModal();
    fireEvent.click(button('payment_card'));
    fireEvent.click(button('payment_collect'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('payment_required_reload', { autoClose: 5000 });
    });
  });

  // D-062: a clear message, followed by the API text when there is one; never "[object Object]".
  it.each([
    [
      '400 without code',
      { status: 400, data: { error: 'Invalid product quantity' } },
      `error_adding_order_detail (${JSON.stringify({ detail: 'Invalid product quantity' })})`,
    ],
    [
      '500 with a text',
      { status: 500, data: { error: 'An application error occurred' } },
      `error_adding_order_detail (${JSON.stringify({ detail: 'An application error occurred' })})`,
    ],
    ['500 without body', { status: 500, data: 'Internal Server Error' }, 'error_adding_order'],
    [
      'network failure',
      { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' },
      'error_adding_order',
    ],
    ['serialized error', { name: 'Error', message: 'boom' }, 'error_adding_order'],
    ['non-string API text', { status: 400, data: { error: { a: 1 } } }, 'error_adding_order'],
  ])('shows a readable message on a %s (D-062)', async (_label, error, expected) => {
    // RTK Query rejects with a plain object; wrapped in an Error for the lint rule.
    const rejection = Object.assign(new Error('rejected'), error);
    mockAddOrder.mockReturnValue({ unwrap: () => Promise.reject(rejection) });
    renderModal();
    fireEvent.click(button('payment_card'));
    fireEvent.click(button('payment_collect'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expected, { autoClose: 5000 });
    });
    expect(String((toast.error as jest.Mock).mock.calls[0][0])).not.toContain('[object Object]');
  });

  it('disables every action while saving', () => {
    (useAddOrderMutation as jest.Mock).mockReturnValue([mockAddOrder, { isLoading: true }]);
    renderModal();
    expect(button('payment_card')).toBeDisabled();
    expect(button('payment_cash')).toBeDisabled();
    fireEvent.click(button('payment_card'));
    expect(mockAddOrder).not.toHaveBeenCalled();
  });
});
