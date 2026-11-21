import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ProductFormModal } from '../ProductFormModal';
import { render } from '../../../utils/testUtils';
import { useLayoutMode } from '../../../hooks/useLayoutMode';

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
jest.mock('../../../services/product', () => {
  const { useMockMutation } = jest.requireActual<typeof import('../../../test/mutationMock')>(
    '../../../test/mutationMock'
  );
  return {
    useCreateProductMutation: () => useMockMutation(mockCreateProduct),
    useUpdateProductMutation: () => useMockMutation(mockUpdateProduct),
  };
});
jest.mock('../../../hooks/useLayoutMode', () => ({
  ...jest.requireActual<typeof import('../../../hooks/useLayoutMode')>(
    '../../../hooks/useLayoutMode'
  ),
  useLayoutMode: jest.fn(() => 'desktop'),
}));
jest.mock('../../../services/categories', () => ({
  useGetCategoriesQuery: () => ({ data: [{ id: 4, name: 'Eco-cup' }] }),
}));

const setCurrency = (currency?: string) => {
  window.APP_CONFIG = currency ? { VITE_CURRENCY: currency } : undefined;
};

const renderForm = (onClose: () => void = jest.fn()) =>
  render(<ProductFormModal isOpen={true} onClose={onClose} defaultCategoryId={4} />);

const product = { id: 7, name: 'Bière', price: 3, categoryId: 4, icon: 'beer' } as const;

const renderEdit = (onClose: () => void = jest.fn()) =>
  render(<ProductFormModal isOpen={true} onClose={onClose} product={{ ...product }} />);

const prompt = () =>
  screen.getByText('unsaved_changes.message').closest('[role="dialog"]') as HTMLElement;

const typeName = (name: string) =>
  fireEvent.change(screen.getByLabelText(/product_management.form.name/), {
    target: { value: name },
  });

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
    mockUpdateProduct.mockReturnValue({ unwrap: () => Promise.resolve(product) });
    mockCreateProduct.mockReturnValue({ unwrap: () => Promise.resolve(1) });
    (useLayoutMode as jest.Mock).mockReturnValue('desktop');
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

  // docs/design/components.md, "Modales (hors encaissement)": full screen on phones only.
  it.each([
    ['phone-portrait', true],
    ['phone-landscape', true],
    ['desktop', false],
  ])('in %s, full screen is %s', (mode, fullScreen) => {
    (useLayoutMode as jest.Mock).mockReturnValue(mode);
    renderForm();
    const content = screen.getByRole('dialog').closest('[data-full-screen]');
    expect(content !== null).toBe(fullScreen);
  });

  it('puts "cancel" before the main action', () => {
    renderForm();
    const cancel = screen.getByRole('button', { name: 'cancel' });
    const create = screen.getByRole('button', { name: 'actions.create' });
    expect(cancel.compareDocumentPosition(create) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // D-052: saved at once, closing with changes asks first.
  describe('saving and closing (D-052)', () => {
    it('saves a change at once, without confirmation', async () => {
      const onClose = jest.fn();
      renderEdit(onClose);
      typeName('Bière blonde');
      fireEvent.click(screen.getByRole('button', { name: 'actions.save' }));

      await waitFor(() =>
        expect(mockUpdateProduct).toHaveBeenCalledWith({
          id: 7,
          name: 'Bière blonde',
          price: 3,
          categoryId: 4,
          icon: 'beer',
        })
      );
      expect(screen.queryByText('unsaved_changes.title')).not.toBeInTheDocument();
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('closes without calling the API when nothing changed', () => {
      const onClose = jest.fn();
      renderEdit(onClose);
      fireEvent.click(screen.getByRole('button', { name: 'actions.save' }));

      expect(onClose).toHaveBeenCalled();
      expect(mockUpdateProduct).not.toHaveBeenCalled();
    });

    it.each([['cancel'], ['close']])('closes at once with "%s" when nothing changed', (button) => {
      const onClose = jest.fn();
      renderEdit(onClose);
      fireEvent.click(screen.getByRole('button', { name: button }));

      expect(onClose).toHaveBeenCalled();
      expect(screen.queryByText('unsaved_changes.title')).not.toBeInTheDocument();
    });

    it.each([['cancel'], ['close']])(
      'asks before closing with "%s" after a change',
      async (button) => {
        const onClose = jest.fn();
        renderEdit(onClose);
        typeName('Bière blonde');
        fireEvent.click(screen.getByRole('button', { name: button }));

        expect(onClose).not.toHaveBeenCalled();
        expect(await screen.findByText('unsaved_changes.title')).toBeInTheDocument();
      }
    );

    // DS-3 of PR #45: the cross of the prompt does the same as "cancel".
    it.each([['cancel'], ['close']])(
      '"%s" in the prompt goes back to the form with the typed values',
      async (button) => {
        const onClose = jest.fn();
        renderEdit(onClose);
        typeName('Bière blonde');
        fireEvent.click(screen.getByRole('button', { name: 'close' }));
        await screen.findByText('unsaved_changes.title');
        fireEvent.click(within(prompt()).getByRole('button', { name: button }));

        expect(onClose).not.toHaveBeenCalled();
        await waitFor(() =>
          expect(screen.queryByText('unsaved_changes.title')).not.toBeInTheDocument()
        );
        expect(screen.getByLabelText(/product_management.form.name/)).toHaveValue('Bière blonde');
      }
    );

    it('"discard" closes without saving', async () => {
      const onClose = jest.fn();
      renderEdit(onClose);
      typeName('Bière blonde');
      fireEvent.click(screen.getByRole('button', { name: 'close' }));
      await screen.findByText('unsaved_changes.title');
      fireEvent.click(within(prompt()).getByRole('button', { name: 'unsaved_changes.discard' }));

      expect(onClose).toHaveBeenCalled();
      expect(mockUpdateProduct).not.toHaveBeenCalled();
    });

    it('"save" in the prompt saves the changes', async () => {
      const onClose = jest.fn();
      renderEdit(onClose);
      typeName('Bière blonde');
      fireEvent.click(screen.getByRole('button', { name: 'close' }));
      await screen.findByText('unsaved_changes.title');
      fireEvent.click(within(prompt()).getByRole('button', { name: 'actions.save' }));

      await waitFor(() =>
        expect(mockUpdateProduct).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Bière blonde' })
        )
      );
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('"save" in the prompt keeps the form open when it is invalid', async () => {
      const onClose = jest.fn();
      renderForm(onClose);
      fireEvent.change(screen.getByLabelText(/product_management.form.price/), {
        target: { value: '2' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'close' }));
      await screen.findByText('unsaved_changes.title');
      fireEvent.click(within(prompt()).getByRole('button', { name: 'actions.save' }));

      expect(mockCreateProduct).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(await screen.findByText('errors.required')).toBeInTheDocument();
    });

    // TL-1 of PR #45: "Enregistrer" is disabled while the request runs.
    it('a double click in creation sends a single request', async () => {
      mockCreateProduct.mockReturnValue({ unwrap: () => new Promise(() => {}) });
      renderForm();
      fillAndSubmit('Bière', '3');
      fireEvent.click(screen.getByRole('button', { name: 'actions.create' }));

      await waitFor(() => expect(mockCreateProduct).toHaveBeenCalledTimes(1));
      expect(screen.getByRole('button', { name: 'actions.create' })).toBeDisabled();
    });

    it('"save" in the prompt then in the form sends a single request', async () => {
      mockUpdateProduct.mockReturnValue({ unwrap: () => new Promise(() => {}) });
      renderEdit();
      typeName('Bière blonde');
      fireEvent.click(screen.getByRole('button', { name: 'close' }));
      await screen.findByText('unsaved_changes.title');
      fireEvent.click(within(prompt()).getByRole('button', { name: 'actions.save' }));
      await waitFor(() =>
        expect(screen.queryByText('unsaved_changes.title')).not.toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole('button', { name: 'actions.save' }));

      expect(mockUpdateProduct).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: 'actions.save' })).toBeDisabled();
    });

    it('asks in creation too, as soon as something was typed', async () => {
      const onClose = jest.fn();
      renderForm(onClose);
      typeName('Bière');
      fireEvent.click(screen.getByRole('button', { name: 'cancel' }));

      expect(onClose).not.toHaveBeenCalled();
      expect(await screen.findByText('unsaved_changes.title')).toBeInTheDocument();
    });

    it('does not ask in creation when nothing was typed', () => {
      const onClose = jest.fn();
      renderForm(onClose);
      fireEvent.click(screen.getByRole('button', { name: 'cancel' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('a value typed back to the original is not a change', () => {
      const onClose = jest.fn();
      renderEdit(onClose);
      typeName('Autre');
      typeName('Bière');
      fireEvent.click(screen.getByRole('button', { name: 'close' }));

      expect(onClose).toHaveBeenCalled();
    });
  });
});
