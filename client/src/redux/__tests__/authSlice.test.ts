import { configureStore } from '@reduxjs/toolkit';
import type { AuthUserType } from 'shared-ts';
import {
  authReducer,
  checkSession,
  loggedIn,
  logOut,
  passwordChanged,
  sessionExpired,
} from '../authSlice';
import { cartReducer } from '../cartSlice';
import { authBaseQuery } from '../../services/baseQuery';

jest.mock('../../config', () => ({ BASE_API_URL: 'http://api.test/api' }));

const user: AuthUserType = {
  id: 1,
  username: 'caisse',
  role: 'cashier',
  permissions: ['sale'],
  mustChangePassword: false,
};

const cartItem = {
  product: { id: 1, name: 'Café', price: 2, categoryId: 1 },
  quantity: 2,
  discountedAmount: 0,
};

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, cart: cartReducer },
    preloadedState: { cart: { items: [cartItem], discount: 0 } as never },
  });

type FakeResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
  headers: Headers;
  clone: () => FakeResponse;
};

const mockFetch = (status: number, body: unknown = {}) => {
  const response: FakeResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers({ 'content-type': 'application/json' }),
    clone: () => response,
  };
  global.fetch = jest.fn().mockResolvedValue(response);
};

describe('auth state (D-063)', () => {
  it('starts by checking the session, then shows the login or the register', async () => {
    const store = makeStore();
    expect(store.getState().auth.status).toBe('checking');

    mockFetch(401);
    await store.dispatch(checkSession());
    expect(store.getState().auth).toEqual({ status: 'anonymous', user: null, notice: null });

    mockFetch(200, { user });
    await store.dispatch(checkSession());
    expect(store.getState().auth).toMatchObject({ status: 'authenticated', user });
  });

  it('treats a network error at startup as no session (login screen)', async () => {
    const store = makeStore();
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    await store.dispatch(checkSession());
    expect(store.getState().auth.status).toBe('anonymous');
  });

  it('an expired session goes back to the login with a notice, and keeps the cart (answer 7 a)', () => {
    const store = makeStore();
    store.dispatch(loggedIn(user));
    const cart = store.getState().cart;

    store.dispatch(sessionExpired());
    expect(store.getState().auth).toEqual({ status: 'anonymous', user: null, notice: 'expired' });
    expect(store.getState().cart).toBe(cart);

    // Not logged in any more: a second 401 changes nothing.
    store.dispatch(sessionExpired());
    expect(store.getState().auth.notice).toBe('expired');
  });

  it('never shows the notice when no one was logged in', () => {
    const store = makeStore();
    store.dispatch(sessionExpired());
    expect(store.getState().auth.status).toBe('checking');
  });

  it('logs out at once, without a notice, and keeps the cart (point 5)', async () => {
    const store = makeStore();
    store.dispatch(loggedIn(user));
    mockFetch(204);
    const done = store.dispatch(logOut());
    expect(store.getState().auth).toEqual({ status: 'anonymous', user: null, notice: null });
    await done;
    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/api/auth/logout',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
    expect(store.getState().cart.items).toEqual([cartItem]);
  });
});

describe('authBaseQuery', () => {
  // jsdom has no Request: just what fetchBaseQuery reads.
  beforeAll(() => {
    (global as unknown as { Request: unknown }).Request = class {
      url: string;
      credentials?: string;
      headers: Headers;
      constructor(url: string, init: { credentials?: string; headers?: HeadersInit } = {}) {
        Object.assign(this, init);
        this.url = url;
        this.headers = new Headers(init.headers);
      }
      clone() {
        return this;
      }
    };
  });

  const run = async (
    status: number,
    body: unknown = status === 401 ? { code: 'UNAUTHENTICATED' } : []
  ) => {
    const store = makeStore();
    store.dispatch(loggedIn(user));
    mockFetch(status, body);
    const query = authBaseQuery({ baseUrl: 'http://api.test/api/products' });
    const result = await query(
      '',
      {
        dispatch: store.dispatch,
        getState: store.getState,
        signal: new AbortController().signal,
        abort: jest.fn(),
        extra: undefined,
        endpoint: 'getProducts',
        type: 'query',
      } as never,
      {}
    );
    return { store, result };
  };

  it('sends the cookie, and a 401 ends the session on the screen', async () => {
    const { store, result } = await run(401);
    expect((result as { error?: { status: number } }).error?.status).toBe(401);
    expect(store.getState().auth.notice).toBe('expired');
    const request = (global.fetch as jest.Mock).mock.calls[0][0] as Request;
    expect(request.credentials).toBe('include');
  });

  it('leaves the session alone on other answers', async () => {
    const { store } = await run(200);
    expect(store.getState().auth.status).toBe('authenticated');
    const forbidden = await run(403, { code: 'FORBIDDEN' });
    expect(forbidden.store.getState().auth.user?.mustChangePassword).toBe(false);
  });

  it('keeps the session on 403 PASSWORD_CHANGE_REQUIRED and asks for a new password (D-064)', async () => {
    const { store } = await run(403, { code: 'PASSWORD_CHANGE_REQUIRED' });
    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().auth.notice).toBeNull();
    expect(store.getState().auth.user?.mustChangePassword).toBe(true);
  });
});

describe('password change state (D-064)', () => {
  it('replaces the user after a change, only while logged in', () => {
    const store = makeStore();
    store.dispatch(passwordChanged({ ...user, mustChangePassword: false }));
    expect(store.getState().auth.user).toBeNull();
    store.dispatch(loggedIn({ ...user, mustChangePassword: true }));
    store.dispatch(passwordChanged({ ...user, mustChangePassword: false }));
    expect(store.getState().auth.user?.mustChangePassword).toBe(false);
    expect(store.getState().auth.status).toBe('authenticated');
  });
});
