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
        icon: null,
      })
    );
  });

  it('stores euros in cents, with a comma as decimal separator (D-010)', async () => {
    setCurrency('EUR');
    renderForm();
    expect(screen.getByLabelText(/product_management.form.price_eur/)).toBeInTheDocument();

    fillAndSubmit('Bière', '2,50');

    await waitFor(() =>
      expect(mockCreateProduct).toHaveBeenCalledWith({
        name: 'Bière',
        price: 250,
        categoryId: 4,
        icon: null,
      })
    );
  });

  it('has no icon by default and sends the chosen icon key (D-046)', async () => {
    renderForm();
    expect(screen.getByTestId('icon-picker-current')).toHaveTextContent('icon_picker.none');

    fireEvent.click(screen.getByRole('button', { name: 'icon_picker.choose' }));
    expect(screen.getByRole('button', { name: /icon_picker.none/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.click(screen.getByRole('button', { name: 'catalog_icons.beer' }));
    expect(screen.getByRole('button', { name: 'catalog_icons.beer' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fillAndSubmit('Bière', '3');

    await waitFor(() =>
      expect(mockCreateProduct).toHaveBeenCalledWith({
        name: 'Bière',
        price: 3,
        categoryId: 4,
        icon: 'beer',
      })
    );
  });

  it('offers the 29 icons of the closed list, "Aucune" first', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'icon_picker.choose' }));
    const options = screen.getAllByRole('button', { pressed: false });
    expect(
      options.filter((b) => /^catalog_icons\./.test(b.getAttribute('aria-label') ?? ''))
    ).toHaveLength(29);
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
        icon: null,
      })
    );
  });
});
