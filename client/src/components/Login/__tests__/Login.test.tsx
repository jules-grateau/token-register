import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import type { AuthUserType } from 'shared-ts';
import { act, fireEvent, render, screen, waitFor } from '../../../utils/testUtils';
import { authReducer, loggedIn, sessionExpired } from '../../../redux/authSlice';
import { login } from '../../../services/auth';
import Login from '..';
import AuthGate from '../../AuthGate';

jest.mock('../../../config', () => ({ BASE_API_URL: 'http://api.test/api' }));
jest.mock('../../../services/auth', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  fetchCurrentUser: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}));

const mockLogin = login as jest.MockedFunction<typeof login>;
const { fetchCurrentUser } = jest.requireMock<{ fetchCurrentUser: jest.Mock }>(
  '../../../services/auth'
);

const user: AuthUserType = {
  id: 1,
  username: 'caisse',
  role: 'cashier',
  permissions: ['sale'],
  mustChangePassword: false,
};

const makeStore = () => configureStore({ reducer: { auth: authReducer } });

const renderLogin = (store = makeStore()) => {
  render(
    <Provider store={store}>
      <Login />
    </Provider>
  );
  return store;
};

const fill = (username: string, password: string) => {
  fireEvent.change(screen.getByLabelText('auth.username'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: password } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'auth.submit' }));

describe('Login screen (D-063)', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('labels the fields for the password managers, without autocorrection', () => {
    renderLogin();
    const username = screen.getByLabelText('auth.username');
    const password = screen.getByLabelText('auth.password');
    expect(username).toHaveAttribute('autocomplete', 'username');
    expect(username).toHaveAttribute('autocapitalize', 'none');
    expect(username).toHaveAttribute('autocorrect', 'off');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(password).toHaveAttribute('type', 'password');
  });

  it('gives both fields 48 px and 16 px text (DS-2 of PR #97)', () => {
    renderLogin();
    for (const label of ['auth.username', 'auth.password']) {
      expect(screen.getByLabelText(label)).toHaveStyle({ height: '48px', fontSize: '16px' });
    }
    expect(screen.getByRole('button', { name: 'auth.show_password' })).toHaveStyle({
      width: '44px',
      height: '44px',
    });
  });

  it('shows the password on demand, with a labelled eye button (answer 13 a)', () => {
    renderLogin();
    // Mantine toggles on mouse down (touch end and keyboard too).
    fireEvent.mouseDown(screen.getByRole('button', { name: 'auth.show_password' }));
    expect(screen.getByLabelText('auth.password')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'auth.hide_password' })).toBeInTheDocument();
  });

  it('sends the fields as typed (the API trims the name), and opens the register', async () => {
    mockLogin.mockResolvedValue({ ok: true, user });
    const store = renderLogin();
    fill(' caisse ', 'secret-1');
    submit();
    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'));
    expect(mockLogin).toHaveBeenCalledWith({ username: ' caisse ', password: 'secret-1' });
  });

  it('one message for a refusal: clears the password only and focuses it (answer 6 a)', async () => {
    mockLogin.mockResolvedValue({ ok: false, reason: 'invalid' });
    renderLogin();
    fill('caisse', 'wrong-1');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('auth.invalid');
    expect(screen.getByLabelText('auth.username')).toHaveValue('caisse');
    expect(screen.getByLabelText('auth.password')).toHaveValue('');
    await waitFor(() => expect(screen.getByLabelText('auth.password')).toHaveFocus());
  });

  it('after 5 failures, disables the button for the wait, then enables it again', async () => {
    jest.useFakeTimers();
    mockLogin.mockResolvedValue({ ok: false, reason: 'too_many', retryAfterSeconds: 60 });
    renderLogin();
    fill('caisse', 'wrong-1');
    await act(async () => {
      submit();
      await Promise.resolve();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('auth.too_many');
    expect(screen.getByRole('button', { name: 'auth.submit' })).toBeDisabled();
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole('button', { name: 'auth.submit' })).toBeEnabled();
  });

  it('says a network error', async () => {
    mockLogin.mockResolvedValue({ ok: false, reason: 'error' });
    renderLogin();
    fill('caisse', 'secret-1');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('errors.network');
  });

  it('says in a neutral tone that the session expired (answer 7 a)', () => {
    const store = makeStore();
    store.dispatch(loggedIn(user));
    store.dispatch(sessionExpired());
    renderLogin(store);
    expect(screen.getByRole('status')).toHaveTextContent('auth.expired');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('AuthGate', () => {
  const renderGate = () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <AuthGate>
          <div data-testid="register" />
        </AuthGate>
      </Provider>
    );
    return store;
  };

  it('shows a neutral screen while checking, never the register first', async () => {
    let resolve: (value: AuthUserType | null) => void = () => {};
    fetchCurrentUser.mockReturnValue(new Promise((r) => (resolve = r)));
    renderGate();
    expect(screen.getByRole('status', { name: 'auth.loading' })).toBeInTheDocument();
    expect(screen.queryByTestId('register')).not.toBeInTheDocument();
    await act(async () => {
      resolve(user);
      await Promise.resolve();
    });
    expect(screen.getByTestId('register')).toBeInTheDocument();
  });

  it('shows the login screen without a session', async () => {
    fetchCurrentUser.mockResolvedValue(null);
    renderGate();
    expect(await screen.findByLabelText('auth.username')).toBeInTheDocument();
    expect(screen.queryByTestId('register')).not.toBeInTheDocument();
  });
});
