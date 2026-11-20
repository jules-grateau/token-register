import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import OrderHistoryModal from '../index';
import { useGetOrdersQuery, useRemoveOrderMutation } from '../../../services/orders';
import { toast } from 'react-toastify';
import { render } from '../../../utils/testUtils';
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      key === 'order_line'
        ? `${opts.quantity} × ${opts.name}`
        : key === 'payment_badge'
          ? `${opts.mode} ${opts.amount}`
          : opts && opts.id
            ? `${key} (${opts.id}${opts.date ? ', ' + opts.date : ''})`
            : opts && opts.count !== undefined
              ? `${key} (${opts.count})`
              : key,
  }),
}));
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../../../services/orders', () => ({
  useGetOrdersQuery: jest.fn(),
  useRemoveOrderMutation: jest.fn(),
}));

const refetch = jest.fn();
const mockRemoveOrder = jest.fn();

const makeItem = (
  productId: number,
  productName: string,
  productPrice: number,
  quantity: number
) => ({
  productId,
  productName,
  productPrice,
  categoryName: 'Fruits',
  quantity,
  discountedAmount: 0,
});

const mockOrders = {
  data: [
    {
      id: 1,
      date: Date.now(),
      items: [makeItem(1, 'Apple', 10, 2), makeItem(2, 'Banana', 5, 1)],
    },
  ],
  pagination: { currentPage: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
};

describe('OrderHistoryModal', () => {
  beforeEach(() => {
    (useGetOrdersQuery as jest.Mock).mockReturnValue({
      data: mockOrders,
      isFetching: false,
      error: undefined,
      refetch,
    });
    (useRemoveOrderMutation as jest.Mock).mockReturnValue([mockRemoveOrder, { isLoading: false }]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    (useGetOrdersQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: true,
      error: undefined,
      refetch,
    });
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (useGetOrdersQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
      error: true,
      refetch,
    });
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('error_loading_orders')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    (useGetOrdersQuery as jest.Mock).mockReturnValue({
      data: {
        data: [],
        pagination: { currentPage: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
      },
      isFetching: false,
      error: undefined,
      refetch,
    });
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('no_orders')).toBeInTheDocument();
  });

  it('renders orders and order details', () => {
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText(/order_title/i)).toBeInTheDocument();
    expect(screen.getByText(/Apple/)).toBeInTheDocument();
    expect(screen.getByText(/Banana/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('prefixes each line with its quantity (D-023)', () => {
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('2 × Apple')).toBeInTheDocument();
    expect(screen.getByText('1 × Banana')).toBeInTheDocument();
  });

  it('does not render quantity controls in order items', () => {
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /plus/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /minus/i })).not.toBeInTheDocument();
  });

  it('opens confirmation modal when delete is clicked', async () => {
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(await screen.findByText(/order_removal_confirmation/i)).toBeInTheDocument();
  });

  it('confirms the deletion with a red "delete" button (D-050)', async () => {
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    const confirmationModal = await screen.findByRole('dialog', { name: /confirmation/i });
    const buttons = within(confirmationModal).getAllByRole('button', {
      name: /^(cancel|delete)$/,
    });
    expect(buttons.map((button) => button.textContent)).toEqual(['cancel', 'delete']);
    expect(buttons[1]).toHaveAttribute('data-destructive', 'true');
  });

  it('removes order and shows toast on confirm', async () => {
    mockRemoveOrder.mockReturnValue({ unwrap: () => Promise.resolve() });
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    const confirmationModal = await screen.findByRole('dialog', { name: /confirmation/i });
    const confirmButton = within(confirmationModal).getByRole('button', { name: 'delete' });
    fireEvent.click(confirmButton);
    await waitFor(() => {
      expect(mockRemoveOrder).toHaveBeenCalled();
    });
    expect(toast.success).toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
  });

  it('shows error toast if remove fails', async () => {
    mockRemoveOrder.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail')),
    });
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    const confirmationModal = await screen.findByRole('dialog', { name: /confirmation/i });
    const confirmButton = within(confirmationModal).getByRole('button', { name: 'delete' });
    fireEvent.click(confirmButton);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(refetch).toHaveBeenCalled();
  });

  describe('payment badges (D-034)', () => {
    const withPayment = (payment: unknown) => ({
      ...mockOrders,
      data: [{ ...mockOrders.data[0], payment }],
    });
    const mockQuery = (data: unknown) =>
      (useGetOrdersQuery as jest.Mock).mockReturnValue({
        data,
        isFetching: false,
        error: undefined,
        refetch,
      });

    afterEach(() => {
      window.APP_CONFIG = undefined;
    });

    it('shows one badge per recorded mode on an EUR instance', () => {
      window.APP_CONFIG = { VITE_CURRENCY: 'EUR' };
      mockQuery(withPayment({ cashAmount: 500, cardAmount: 250 }));
      render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
      const badges = screen.getByTestId('order-payment');
      expect(within(badges).getByText(/payment_cash 5,00/)).toBeInTheDocument();
      expect(within(badges).getByText(/payment_card 2,50/)).toBeInTheDocument();
    });

    it('shows the single mode of a zero total', () => {
      window.APP_CONFIG = { VITE_CURRENCY: 'EUR' };
      mockQuery(withPayment({ cashAmount: 0, cardAmount: null }));
      render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByText(/payment_cash 0,00/)).toBeInTheDocument();
      expect(screen.queryByText(/payment_card/)).not.toBeInTheDocument();
    });

    it('shows no badge for older orders or on token instances', () => {
      window.APP_CONFIG = { VITE_CURRENCY: 'EUR' };
      mockQuery(withPayment(null));
      const { unmount } = render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
      expect(screen.queryByTestId('order-payment')).not.toBeInTheDocument();
      unmount();

      window.APP_CONFIG = undefined;
      mockQuery(withPayment({ cashAmount: 5, cardAmount: null }));
      render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
      expect(screen.queryByTestId('order-payment')).not.toBeInTheDocument();
    });
  });
});
