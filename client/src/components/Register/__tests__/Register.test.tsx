import { screen, fireEvent } from '@testing-library/react';
import { Register } from '../index';
import { render } from '../../../utils/testUtils';

jest.mock('react-redux', () => ({
  useSelector: () => false,
  useDispatch: () => jest.fn(),
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
