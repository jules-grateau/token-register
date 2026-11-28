import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import type { AuthUserType } from 'shared-ts';
import { fireEvent, render, screen, waitFor } from '../../../utils/testUtils';
import { authReducer, loggedIn } from '../../../redux/authSlice';
import { changePassword } from '../../../services/auth';
import ChangePasswordForm from '../ChangePasswordForm';
import AuthGate from '../../AuthGate';

jest.mock('../../../config', () => ({ BASE_API_URL: 'http://api.test/api' }));
jest.mock('../../../services/auth', () => ({
  changePassword: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  fetchCurrentUser: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}));

const mockChange = changePassword as jest.MockedFunction<typeof changePassword>;
const { fetchCurrentUser, logout } = jest.requireMock<{
  fetchCurrentUser: jest.Mock;
  logout: jest.Mock;
}>('../../../services/auth');

// Generated, fake values only (public repository).
const fake = () => `pw-${Math.random().toString(36).slice(2, 10)}`;
const user: AuthUserType = {
  id: 7,
  username: 'caisse',
  role: 'cashier',
  permissions: ['sale'],
  mustChangePassword: false,
};

const makeStore = (initial: AuthUserType = user) => {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(loggedIn(initial));
  return store;
};

const renderForm = (variant: 'own' | 'temporary' = 'own', onSuccess = jest.fn()) => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <ChangePasswordForm variant={variant} onSuccess={onSuccess} />
    </Provider>
  );
  return { store, onSuccess };
};

const currentLabel = (variant: 'own' | 'temporary') =>
  variant === 'own' ? 'auth.change_password.current' : 'auth.change_password.temporary';
const fill = (
  current: string,
  next: string,
  confirm = next,
  variant: 'own' | 'temporary' = 'own'
) => {
  fireEvent.change(screen.getByLabelText(currentLabel(variant)), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('auth.change_password.new'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('auth.change_password.confirm'), {
    target: { value: confirm },
  });
};
const submit = (label = 'auth.change_password.submit') =>
  fireEvent.click(screen.getByRole('button', { name: label }));

describe('ChangePasswordForm (D-064)', () => {
  afterEach(() => jest.clearAllMocks());

  it('masks the three fields, each with its own labelled eye, for the password managers', () => {
    renderForm();
    expect(screen.getByLabelText('auth.change_password.current')).toHaveAttribute(
      'autocomplete',
      'current-password'
    );
    for (const label of ['auth.change_password.new', 'auth.change_password.confirm']) {
      const field = screen.getByLabelText(label);
      expect(field).toHaveAttribute('autocomplete', 'new-password');
      expect(field).toHaveAttribute('type', 'password');
      expect(field).toHaveStyle({ height: '48px', fontSize: '16px' });
    }
    const eyes = screen.getAllByRole('button', { name: 'auth.show_password' });
    expect(eyes).toHaveLength(3);
    fireEvent.mouseDown(eyes[1]);
    expect(screen.getByLabelText('auth.change_password.new')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('auth.change_password.current')).toHaveAttribute(
      'type',
      'password'
    );
  });

  it('checks the new password before sending: length, same as the current one, confirmation', () => {
    renderForm();
    const current = fake();
    fill(current, '12345');
    submit();
    expect(screen.getByText('auth.change_password.too_short')).toBeInTheDocument();

    fill(current, current);
    submit();
    expect(screen.getByText('auth.change_password.same')).toBeInTheDocument();

    fill(current, fake(), fake());
    submit();
    expect(screen.getByText('auth.change_password.mismatch')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.change_password.confirm')).toHaveFocus();
    expect(mockChange).not.toHaveBeenCalled();
  });

  it('clears only the current password on a wrong one, with a generic message', async () => {
    mockChange.mockResolvedValue({ ok: false, reason: 'wrong_current' });
    renderForm();
    const next = fake();
    fill(fake(), next);
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'auth.change_password.wrong_current'
    );
    expect(screen.getByLabelText('auth.change_password.current')).toHaveValue('');
    expect(screen.getByLabelText('auth.change_password.new')).toHaveValue(next);
    await waitFor(() =>
      expect(screen.getByLabelText('auth.change_password.current')).toHaveFocus()
    );
  });

  it('waits after too many wrong current passwords', async () => {
    mockChange.mockResolvedValue({ ok: false, reason: 'too_many', retryAfterSeconds: 60 });
    renderForm();
    fill(fake(), fake());
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('auth.too_many');
    expect(screen.getByRole('button', { name: 'auth.change_password.submit' })).toBeDisabled();
  });

  it('keeps the session and updates the user on success', async () => {
    mockChange.mockResolvedValue({ ok: true, user });
    const { onSuccess } = renderForm();
    const current = fake();
    const next = fake();
    fill(current, next);
    submit();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(mockChange).toHaveBeenCalledWith({ currentPassword: current, newPassword: next });
  });
});

describe('temporary password screen (D-064, answer 3 a)', () => {
  afterEach(() => jest.clearAllMocks());

  const renderGate = () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    render(
      <Provider store={store}>
        <AuthGate>
          <div data-testid="register" />
        </AuthGate>
      </Provider>
    );
    return store;
  };

  it('replaces the register, also after a reload (GET /auth/me), then opens it', async () => {
    fetchCurrentUser.mockResolvedValue({ ...user, mustChangePassword: true });
    mockChange.mockResolvedValue({ ok: true, user });
    renderGate();
    expect(await screen.findByTestId('forced-password-change')).toBeInTheDocument();
    expect(screen.queryByTestId('register')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('auth.change_password.forced_notice');
    expect(screen.queryByRole('button', { name: 'close' })).toBeNull();

    fill(fake(), fake(), undefined, 'temporary');
    submit('auth.change_password.forced_submit');
    expect(await screen.findByTestId('register')).toBeInTheDocument();
  });

  it('says "temporaire" in the messages, and logs out without confirmation', async () => {
    fetchCurrentUser.mockResolvedValue({ ...user, mustChangePassword: true });
    mockChange.mockResolvedValue({ ok: false, reason: 'wrong_current' });
    const store = renderGate();
    await screen.findByTestId('forced-password-change');
    fill(fake(), fake(), undefined, 'temporary');
    submit('auth.change_password.forced_submit');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'auth.change_password.wrong_temporary'
    );

    fireEvent.click(screen.getByRole('button', { name: 'auth.logout' }));
    await waitFor(() => expect(store.getState().auth.status).toBe('anonymous'));
    expect(logout).toHaveBeenCalled();
  });
});
