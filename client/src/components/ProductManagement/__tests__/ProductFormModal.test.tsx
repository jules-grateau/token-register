import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductFormModal } from '../ProductFormModal';
import { render } from '../../../utils/testUtils';

const mockCreateProduct = jest.fn();
const mockUpdateProduct = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { context?: string; count?: number }) =>
      opts?.context ? `${key}_${opts.context}` : key,
  }),
}));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock('../../../services/product', () => ({
  useCreateProductMutation: () => [mockCreateProduct],
  useUpdateProductMutation: () => [mockUpdateProduct],
}));
jest.mock('../../../services/categories', () => ({
  useGetCategoriesQuery: () => ({ data: [{ id: 4, name: 'Eco-cup' }] }),
}));

const setCurrency = (currency?: string) => {
  window.APP_CONFIG = currency ? { VITE_CURRENCY: currency } : undefined;
};

const renderForm = () =>
  render(<ProductFormModal isOpen={true} onClose={jest.fn()} defaultCategoryId={4} />);

const fillAndSubmit = (name: string, price: string) => {
  fireEvent.change(screen.getByLabelText(/product_management.form.name/), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText(/product_management.form.price/), {
    target: { value: price },
  });
  fireEvent.click(screen.getByRole('button', { name: 'actions.create' }));
};

describe('ProductFormModal', () => {
  beforeEach(() => {
    mockCreateProduct.mockReturnValue({ unwrap: () => Promise.resolve(1) });
  });

  afterEach(() => {
    setCurrency(undefined);
    jest.clearAllMocks();
  });

  it('keeps the token label and accepts a negative price (D-013)', async () => {
    renderForm();
    expect(screen.queryByLabelText(/form.price_eur/)).not.toBeInTheDocument();

    fillAndSubmit('Retour Eco-cup', '-1');

    await waitFor(() =>
      expect(mockCreateProduct).toHaveBeenCalledWith({
        name: 'Retour Eco-cup',
        price: -1,
        categoryId: 4,
      })
    );
  });

  it('stores euros in cents, with a comma as decimal separator (D-010)', async () => {
    setCurrency('EUR');
    renderForm();
    expect(screen.getByLabelText(/product_management.form.price_eur/)).toBeInTheDocument();

    fillAndSubmit('Bière', '2,50');

    await waitFor(() =>
      expect(mockCreateProduct).toHaveBeenCalledWith({ name: 'Bière', price: 250, categoryId: 4 })
    );
  });

  it('accepts a negative price in euros', async () => {
    setCurrency('EUR');
    renderForm();

    fillAndSubmit('Retour Eco-cup', '-1');

    await waitFor(() =>
      expect(mockCreateProduct).toHaveBeenCalledWith({
        name: 'Retour Eco-cup',
        price: -100,
        categoryId: 4,
      })
    );
  });
});
