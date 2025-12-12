import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import CartConfirmationModal from '../index';
import { useSelector, useDispatch } from 'react-redux';
import { useAddOrderMutation, useGetOrdersQuery } from '../../../services/orders';
import { toast } from 'react-toastify';
import { clearCart } from '../../../redux/cartSlice';
import { render } from '../../../utils/testUtils';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => (opts ? `${key} (${JSON.stringify(opts)})` : key),
  }),
}));

jest.mock('../../../services/orders', () => ({
  useAddOrderMutation: jest.fn(),
  useGetOrdersQuery: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockDispatch = jest.fn();
const mockAddOrder = jest.fn();
const mockRefetchOrders = jest.fn();

const mockCartItems = [
  { product: { id: 1, name: 'Product A' }, quantity: 2, discountedAmount: 0 },
  { product: { id: 2, name: 'Product B' }, quantity: 1, discountedAmount: 0 },
];

describe('CartConfirmationModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
      if (selector.name === 'selectCartItems') return mockCartItems;
      if (selector.name === 'selectTotalPrice') return 150;
      if (selector.name === 'selectTotalItems') return 3;
      return undefined;
    });

    (useAddOrderMutation as jest.Mock).mockReturnValue([mockAddOrder, { isLoading: false }]);
    (useGetOrdersQuery as jest.Mock).mockReturnValue({ refetch: mockRefetchOrders });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<CartConfirmationModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('cart_confirmation')).not.toBeInTheDocument();
  });

  it('renders correctly with cart items when isOpen is true', () => {
    render(<CartConfirmationModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('cart_confirmation')).toBeInTheDocument();
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it('calls onClose when the cancel button is clicked', () => {
    render(<CartConfirmationModal isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockAddOrder).not.toHaveBeenCalled();
  });

  it('handles successful order placement on confirm', async () => {
    const orderId = 'order-123';

    mockAddOrder.mockReturnValue({
      unwrap: () => Promise.resolve(orderId),
    });

    render(<CartConfirmationModal isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockAddOrder).toHaveBeenCalledWith(mockCartItems);
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(clearCart());
      expect(mockRefetchOrders).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        `order_placed (${JSON.stringify({ id: orderId })})`
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('handles failed order placement on confirm', async () => {
    const error = new Error('Network Error');
    mockAddOrder.mockReturnValue({
      unwrap: () => Promise.reject(error),
    });

    render(<CartConfirmationModal isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockAddOrder).toHaveBeenCalledWith(mockCartItems);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        `error_adding_order (${JSON.stringify({ error: String(error) })})`
      );
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('displays a loader and disables actions while loading', () => {
    (useAddOrderMutation as jest.Mock).mockReturnValue([mockAddOrder, { isLoading: true }]);

    render(<CartConfirmationModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockAddOrder).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
