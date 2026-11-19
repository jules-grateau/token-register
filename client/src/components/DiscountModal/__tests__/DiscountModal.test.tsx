import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import DiscountModal from '../index';
import { render } from '../../../utils/testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && opts.itemName
        ? `${key} (${opts.itemName})`
        : opts && opts.count !== undefined
          ? `${key} (${opts.count})`
          : key,
  }),
}));

const mockItem = {
  product: { id: 1, name: 'Apple', price: 10, categoryId: 1 },
  quantity: 2,
  discountedAmount: 0,
};

describe('DiscountModal', () => {
  const onClose = jest.fn();
  const onConfirmDiscount = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with item and default values', () => {
    render(
      <DiscountModal
        isOpen={true}
        onClose={onClose}
        onConfirmDiscount={onConfirmDiscount}
        item={mockItem}
      />
    );
    expect(screen.getByText(/apply_discount/i)).toBeInTheDocument();
    expect(screen.getByText(/Apple/)).toBeInTheDocument();
    expect(screen.getByText(/fixed_amount/i)).toBeInTheDocument();
    expect(screen.getByText(/percentage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fixed/i)).toBeChecked();
  });

  it('switches to percentage discount type', () => {
    render(
      <DiscountModal
        isOpen={true}
        onClose={onClose}
        onConfirmDiscount={onConfirmDiscount}
        item={mockItem}
      />
    );
    fireEvent.click(screen.getByLabelText(/percentage/i));
    expect(screen.getByLabelText(/percentage/i)).toBeChecked();
  });

  it('shows validation error for invalid discount value', () => {
    render(
      <DiscountModal
        isOpen={true}
        onClose={onClose}
        onConfirmDiscount={onConfirmDiscount}
        item={mockItem}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '-5' } });
    expect(screen.getByText(/error_invalid_discount_value_positive/i)).toBeInTheDocument();
  });

  it('calls onConfirmDiscount with correct value and closes on confirm', () => {
    render(
      <DiscountModal
        isOpen={true}
        onClose={onClose}
        onConfirmDiscount={onConfirmDiscount}
        item={mockItem}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirmDiscount).toHaveBeenCalledWith({ discount: 5 });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not confirm if validation error exists', () => {
    render(
      <DiscountModal
        isOpen={true}
        onClose={onClose}
        onConfirmDiscount={onConfirmDiscount}
        item={mockItem}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirmDiscount).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('DiscountModal in euros', () => {
  const onClose = jest.fn();
  const onConfirmDiscount = jest.fn();
  // 2 x 1,25 EUR = 2,50 EUR, stored in cents.
  const eurItem = {
    product: { id: 1, name: 'Apple', price: 125, categoryId: 1 },
    quantity: 2,
    discountedAmount: 0,
  };

  beforeEach(() => {
    window.APP_CONFIG = { VITE_CURRENCY: 'EUR' };
  });

  afterEach(() => {
    window.APP_CONFIG = undefined;
    jest.clearAllMocks();
  });

  const renderModal = () =>
    render(
      <DiscountModal
        isOpen={true}
        onClose={onClose}
        onConfirmDiscount={onConfirmDiscount}
        item={eurItem}
      />
    );

  it('accepts a fixed discount with cents and stores it in cents (D-010)', () => {
    renderModal();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0,50' } });
    expect(screen.getByText(/^2,00\s€$/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirmDiscount).toHaveBeenCalledWith({ discount: 50 });
  });

  it('rounds a percentage discount up to the next cent (D-010)', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText(/percentage/i));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '15' } });
    // 15 % of 2,50 EUR = 0,375 EUR -> 0,38 EUR discount, 2,12 EUR left.
    expect(screen.getByText(/^2,12\s€$/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirmDiscount).toHaveBeenCalledWith({ discount: 38 });
  });
});
