import { fireEvent, render, screen, waitFor, within } from '../../../utils/testUtils';
import type { UserAccountType } from 'shared-ts';
import { toast } from 'react-toastify';
import AccountsModal from '..';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string }) => (opts?.name ? `${key}:${opts.name}` : key),
    i18n: { language: 'fr' },
  }),
}));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, username: 'chef', role: 'admin' }, logOut: jest.fn() }),
}));

let mockAccounts: UserAccountType[] = [];
const mockUpdate = jest.fn();
const mockCreate = jest.fn();
const mockReset = jest.fn();
const ok = (value: unknown = {}) => ({ unwrap: () => Promise.resolve(value) });
// RTK Query rejects unwrap() with the error response itself, not an Error.
const refused = (code: string) => ({
  unwrap: () =>
    Promise.reject(
      Object.assign(new Error('refused'), { status: 409, data: { error: 'refused', code } })
    ),
});
jest.mock('../../../services/users', () => ({
  useGetUsersQuery: () => ({ data: mockAccounts, isError: false, refetch: jest.fn() }),
  useUpdateUserMutation: () => [mockUpdate, { isLoading: false }],
  useCreateUserMutation: () => [mockCreate, { isLoading: false }],
  useResetUserPasswordMutation: () => [mockReset, { isLoading: false }],
}));

const account = (overrides: Partial<UserAccountType>): UserAccountType => ({
  id: 2,
  username: 'caisse',
  role: 'cashier',
  active: true,
  mustChangePassword: false,
  ...overrides,
});
// Generated, fake value only (public repository).
const fakePassword = () => `pw-${Math.random().toString(36).slice(2, 10)}`;

const cardOf = (name: string) =>
  screen
    .getAllByTestId('account-card')
    .find((card) => within(card).queryByRole('heading', { name }) !== null) as HTMLElement;

describe('AccountsModal (D-064)', () => {
  beforeEach(() => {
    mockAccounts = [
      account({ id: 1, username: 'chef', role: 'admin' }),
      account({ id: 3, username: 'adjoint', role: 'admin' }),
      account({ id: 2, username: 'caisse' }),
      account({ id: 4, username: 'parti', active: false }),
    ];
  });
  afterEach(() => jest.clearAllMocks());

  it(`marks one's own account "Vous", without any action (answers 7 a and 12 a)`, () => {
    render(<AccountsModal isOpen onClose={jest.fn()} />);
    const self = cardOf('chef');
    expect(within(self).getByText('accounts.you')).toBeInTheDocument();
    expect(within(self).queryAllByRole('button')).toHaveLength(0);
    expect(within(self).getByText('accounts.self_help')).toBeInTheDocument();
  });

  it('offers no reset nor deactivation on a disabled account, reactivated in one touch (13 b)', () => {
    render(<AccountsModal isOpen onClose={jest.fn()} />);
    const off = cardOf('parti');
    expect(within(off).getByText('accounts.disabled')).toBeInTheDocument();
    expect(within(off).queryByRole('button', { name: /reset_password/ })).toBeNull();
    expect(within(off).queryByRole('button', { name: /aria.deactivate/ })).toBeNull();
    mockUpdate.mockReturnValue(ok());
    fireEvent.click(within(off).getByRole('button', { name: 'accounts.aria.reactivate:parti' }));
    expect(mockUpdate).toHaveBeenCalledWith({ id: 4, active: true });
  });

  it('asks a red confirmation before deactivating, then closes the sessions (answer 6 a)', async () => {
    mockUpdate.mockReturnValue(ok());
    render(<AccountsModal isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'accounts.aria.deactivate:caisse' }));
    expect(mockUpdate).not.toHaveBeenCalled();
    const confirm = await screen.findByRole('dialog', {
      name: 'accounts.deactivate_confirm.title:caisse',
    });
    const buttons = within(confirm).getAllByRole('button', { name: /cancel|accounts.deactivate/ });
    expect(buttons.map((b) => b.textContent)).toEqual(['cancel', 'accounts.deactivate']);
    fireEvent.click(within(confirm).getByRole('button', { name: 'accounts.deactivate' }));
    expect(mockUpdate).toHaveBeenCalledWith({ id: 2, active: false });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('accounts.deactivated:caisse'));
  });

  it('hides "Désactiver" and the role on the last active admin (answer 8 a)', () => {
    mockAccounts = [
      account({ id: 1, username: 'chef', role: 'admin', active: false }),
      account({ id: 3, username: 'adjoint', role: 'admin' }),
    ];
    render(<AccountsModal isOpen onClose={jest.fn()} />);
    const last = cardOf('adjoint');
    expect(within(last).getByText('accounts.last_admin_help')).toBeInTheDocument();
    expect(within(last).queryByRole('button', { name: /deactivate|change_role/ })).toBeNull();
    expect(within(last).getByRole('button', { name: /reset_password/ })).toBeInTheDocument();
  });

  it('changes a role in one touch, and says a refusal in an error toast', async () => {
    mockUpdate.mockReturnValue(ok());
    render(<AccountsModal isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'accounts.aria.change_role:caisse' }));
    const dialog = await screen.findByRole('dialog', { name: 'accounts.role.title:caisse' });
    fireEvent.click(within(dialog).getByLabelText('auth.roles.manager'));
    expect(mockUpdate).toHaveBeenCalledWith({ id: 2, role: 'manager' });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    mockUpdate.mockReturnValue(refused('LAST_ACTIVE_ADMIN'));
    fireEvent.click(screen.getByRole('button', { name: 'accounts.aria.change_role:adjoint' }));
    const second = await screen.findByRole('dialog', { name: 'accounts.role.title:adjoint' });
    fireEvent.click(within(second).getByLabelText('auth.roles.cashier'));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('accounts.errors.LAST_ACTIVE_ADMIN', {
        autoClose: 5000,
      })
    );
  });

  it('resets a password typed by the admin, never repeated in the toast (answer 2 a)', async () => {
    mockReset.mockReturnValue(ok());
    render(<AccountsModal isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'accounts.aria.reset_password:caisse' }));
    const dialog = await screen.findByRole('dialog', { name: 'accounts.reset.title' });
    expect(within(dialog).getByText('accounts.reset.help')).toBeInTheDocument();
    const password = fakePassword();
    fireEvent.change(within(dialog).getByLabelText('accounts.reset.password'), {
      target: { value: password },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'accounts.reset.submit' }));
    expect(mockReset).toHaveBeenCalledWith({ id: 2, password });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('accounts.reset.done:caisse'));
    expect(JSON.stringify((toast.success as jest.Mock).mock.calls)).not.toContain(password);
  });
});

describe('CreateAccountModal (D-064, answer 3 a)', () => {
  beforeEach(() => {
    mockAccounts = [account({ id: 1, username: 'chef', role: 'admin' })];
  });
  afterEach(() => jest.clearAllMocks());

  const openForm = async () => {
    render(<AccountsModal isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'accounts.new' }));
    return screen.findByRole('dialog', { name: 'accounts.create.title' });
  };

  it('preselects no role and does not prefill the admin credentials', async () => {
    const dialog = await openForm();
    expect(within(dialog).getByLabelText('accounts.create.username')).toHaveAttribute(
      'autocomplete',
      'off'
    );
    expect(within(dialog).getByLabelText('accounts.create.password')).toHaveAttribute(
      'autocomplete',
      'new-password'
    );
    for (const role of ['admin', 'manager', 'cashier']) {
      expect(within(dialog).getByLabelText(`auth.roles.${role}`)).not.toBeChecked();
    }
    fireEvent.change(within(dialog).getByLabelText('accounts.create.username'), {
      target: { value: 'nouveau' },
    });
    fireEvent.change(within(dialog).getByLabelText('accounts.create.password'), {
      target: { value: fakePassword() },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'accounts.create.submit' }));
    expect(within(dialog).getByText('accounts.create.role_required')).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('checks the username and the password length before sending', async () => {
    const dialog = await openForm();
    fireEvent.change(within(dialog).getByLabelText('accounts.create.username'), {
      target: { value: 'é!' },
    });
    fireEvent.change(within(dialog).getByLabelText('accounts.create.password'), {
      target: { value: '12345' },
    });
    fireEvent.click(within(dialog).getByLabelText('auth.roles.cashier'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'accounts.create.submit' }));
    expect(within(dialog).getByText('accounts.errors.USERNAME_INVALID')).toBeInTheDocument();
    expect(within(dialog).getByText('auth.change_password.too_short')).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates the account, and writes "déjà pris" under the username on a 409', async () => {
    mockCreate.mockReturnValueOnce(refused('USERNAME_TAKEN'));
    const dialog = await openForm();
    const password = fakePassword();
    fireEvent.change(within(dialog).getByLabelText('accounts.create.username'), {
      target: { value: ' Caisse ' },
    });
    fireEvent.change(within(dialog).getByLabelText('accounts.create.password'), {
      target: { value: password },
    });
    fireEvent.click(within(dialog).getByLabelText('auth.roles.cashier'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'accounts.create.submit' }));
    expect(mockCreate).toHaveBeenCalledWith({ username: 'Caisse', password, role: 'cashier' });
    expect(await within(dialog).findByText('accounts.errors.USERNAME_TAKEN')).toBeInTheDocument();

    mockCreate.mockReturnValueOnce(ok({ ...account({ id: 9, username: 'Caisse2' }) }));
    fireEvent.change(within(dialog).getByLabelText('accounts.create.username'), {
      target: { value: 'Caisse2' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'accounts.create.submit' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('accounts.create.done:Caisse2'));
  });

  it('asks before closing a form with changes (D-052)', async () => {
    const dialog = await openForm();
    fireEvent.change(within(dialog).getByLabelText('accounts.create.username'), {
      target: { value: 'brouillon' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'close' }));
    expect(await screen.findByText('unsaved_changes.title')).toBeInTheDocument();
  });
});
