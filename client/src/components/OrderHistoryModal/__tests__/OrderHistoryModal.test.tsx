import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import OrderHistoryModal from '../index';
import { useGetOrdersQuery, useRemoveOrderMutation } from '../../../services/orders';
import { toast } from 'react-toastify';
import { render } from '../../../utils/testUtils';
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && opts.id
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

const mockOrders = [
  {
    id: 1,
    date: new Date().toISOString(),
    items: [
      { product: { id: 1, name: 'Apple', price: 10 }, quantity: 2, discountedAmount: 0 },
      { product: { id: 2, name: 'Banana', price: 5 }, quantity: 1, discountedAmount: 0 },
    ],
  },
];

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
      data: [],
      isFetching: false,
      error: undefined,
      refetch,
    });
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('no_orders')).toBeInTheDocument();
  });

  it('renders orders and order details', () => {
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText(/order_number/i)).toBeInTheDocument();
    expect(screen.getByText(/Apple/)).toBeInTheDocument();
    expect(screen.getByText(/Banana/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
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

  it('removes order and shows toast on confirm', async () => {
    mockRemoveOrder.mockReturnValue({ unwrap: () => Promise.resolve() });
    render(<OrderHistoryModal isOpen={true} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    const confirmationModal = await screen.findByRole('dialog', { name: /confirmation/i });
    const confirmButton = within(confirmationModal).getByRole('button', { name: /confirm/i });
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
    const confirmButton = within(confirmationModal).getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(refetch).toHaveBeenCalled();
  });
});
