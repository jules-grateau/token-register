import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { CategoryFormModal } from '../CategoryFormModal';
import { render } from '../../../utils/testUtils';

const mockCreateCategory = jest.fn();
const mockUpdateCategory = jest.fn();
const mockDispatch = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock('../../../services/categories', () => {
  const { useMockMutation } = jest.requireActual<typeof import('../../../test/mutationMock')>(
    '../../../test/mutationMock'
  );
  return {
    useCreateCategoryMutation: () => useMockMutation(mockCreateCategory),
    useUpdateCategoryMutation: () => useMockMutation(mockUpdateCategory),
  };
});

const category = { id: 3, name: 'Boissons', icon: null };

const renderEdit = (onClose: () => void) =>
  render(<CategoryFormModal isOpen={true} onClose={onClose} category={{ ...category }} />);

const typeName = (name: string) =>
  fireEvent.change(screen.getByLabelText(/category_management.form.name/), {
    target: { value: name },
  });

const prompt = () =>
  screen.getByText('unsaved_changes.message').closest('[role="dialog"]') as HTMLElement;

// D-052: saved at once, closing with changes asks first.
describe('CategoryFormModal (D-052)', () => {
  beforeEach(() => {
    mockUpdateCategory.mockReturnValue({ unwrap: () => Promise.resolve(category) });
    mockCreateCategory.mockReturnValue({ unwrap: () => Promise.resolve({ id: 9 }) });
  });

  afterEach(() => jest.clearAllMocks());

  it('saves a change at once, without confirmation', async () => {
    const onClose = jest.fn();
    renderEdit(onClose);
    typeName('Snacks');
    fireEvent.click(screen.getByRole('button', { name: 'actions.save' }));

    await waitFor(() =>
      expect(mockUpdateCategory).toHaveBeenCalledWith({ id: 3, name: 'Snacks', icon: null })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(screen.queryByText('unsaved_changes.title')).not.toBeInTheDocument();
  });

  it('closes without calling the API when nothing changed', () => {
    const onClose = jest.fn();
    renderEdit(onClose);
    fireEvent.click(screen.getByRole('button', { name: 'actions.save' }));

    expect(onClose).toHaveBeenCalled();
    expect(mockUpdateCategory).not.toHaveBeenCalled();
  });

  it('closes at once when nothing changed', () => {
    const onClose = jest.fn();
    renderEdit(onClose);
    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('asks before closing after a change, and "discard" closes without saving', async () => {
    const onClose = jest.fn();
    renderEdit(onClose);
    typeName('Snacks');
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));

    expect(onClose).not.toHaveBeenCalled();
    await screen.findByText('unsaved_changes.title');
    fireEvent.click(within(prompt()).getByRole('button', { name: 'unsaved_changes.discard' }));

    expect(onClose).toHaveBeenCalled();
    expect(mockUpdateCategory).not.toHaveBeenCalled();
  });

  it('"save" in the prompt saves the changes', async () => {
    const onClose = jest.fn();
    renderEdit(onClose);
    typeName('Snacks');
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    await screen.findByText('unsaved_changes.title');
    fireEvent.click(within(prompt()).getByRole('button', { name: 'actions.save' }));

    await waitFor(() =>
      expect(mockUpdateCategory).toHaveBeenCalledWith({ id: 3, name: 'Snacks', icon: null })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  // TL-1 of PR #45: "Enregistrer" is disabled while the request runs.
  it('a double click sends a single request', async () => {
    mockUpdateCategory.mockReturnValue({ unwrap: () => new Promise(() => {}) });
    renderEdit(jest.fn());
    typeName('Snacks');
    fireEvent.click(screen.getByRole('button', { name: 'actions.save' }));
    fireEvent.click(screen.getByRole('button', { name: 'actions.save' }));

    await waitFor(() => expect(mockUpdateCategory).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'actions.save' })).toBeDisabled();
  });

  it('asks in creation too, as soon as something was typed', async () => {
    const onClose = jest.fn();
    render(<CategoryFormModal isOpen={true} onClose={onClose} />);
    typeName('Snacks');
    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByText('unsaved_changes.title')).toBeInTheDocument();
  });
});
