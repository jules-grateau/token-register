import { screen, fireEvent } from '@testing-library/react';
import { Register } from '../index';
import { render } from '../../../utils/testUtils';
import { resetLayoutMode, setLayoutMode } from '../../../test/layoutMode';
import { exitEditMode } from '../../../redux/editModeSlice';

let mockIsEditMode = false;
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: () => mockIsEditMode,
  useDispatch: () => mockDispatch,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string }) => (opts?.name ? `${key}: ${opts.name}` : key),
  }),
}));
jest.mock('../../Catalog', () => () => null);
jest.mock('../../Cart', () => () => null);
jest.mock('../../OrderHistoryModal', () => () => null);
jest.mock('../../CartConfirmationModal', () => () => null);
jest.mock('../../AboutModal', () => () => null);

const openSettingsMenu = () => fireEvent.click(screen.getByLabelText('edit_mode.toggle'));

describe('Register settings menu: currency (D-008)', () => {
  afterEach(() => {
    window.APP_CONFIG = undefined;
  });

  it('shows the instance currency as read-only information', async () => {
    window.APP_CONFIG = { VITE_CURRENCY: 'EUR' };
    render(<Register />);
    openSettingsMenu();

    const info = await screen.findByTestId('currency-info');
    expect(info).toHaveTextContent('currency.menu_label: currency.names.EUR');
    expect(info).toHaveTextContent('currency.instance_config');
    expect(info.closest('[role="menuitem"]')).toBeNull();
  });

  it('shows tokens when no currency is configured', async () => {
    render(<Register />);
    openSettingsMenu();

    expect(await screen.findByTestId('currency-info')).toHaveTextContent(
      'currency.menu_label: currency.names.TOKEN'
    );
  });
});

describe('Register header', () => {
  afterEach(() => {
    mockIsEditMode = false;
    resetLayoutMode();
    jest.clearAllMocks();
  });

  it('puts the history button in the header on a phone', () => {
    setLayoutMode('phone-portrait');
    render(<Register />);
    expect(screen.getByRole('button', { name: 'history' })).toBeInTheDocument();
  });

  it('keeps history out of the header on a tablet (it is in the cart)', () => {
    render(<Register />);
    expect(screen.queryByRole('button', { name: 'history' })).not.toBeInTheDocument();
  });

  it('edit mode: "Terminer" leaves edit mode in one touch, history is hidden', () => {
    mockIsEditMode = true;
    setLayoutMode('phone-landscape');
    render(<Register />);
    expect(screen.queryByRole('button', { name: 'history' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'edit_mode.done' }));
    expect(mockDispatch).toHaveBeenCalledWith(exitEditMode());
  });

  it('edit mode on a tablet: shows the "Édition" badge', () => {
    mockIsEditMode = true;
    render(<Register />);
    expect(screen.getByText('edit_mode.badge')).toBeInTheDocument();
  });
});
