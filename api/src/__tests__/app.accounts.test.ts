import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { Writable } from 'stream';
import pino from 'pino';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import type { UserAccountType } from 'shared-ts';
import { createApiControllers, createApp, API_ROUTE } from '../app';
import { AuthService } from '../services/auth.service';
import { LAST_ACTIVE_ADMIN_MESSAGE, UserService } from '../services/user.service';
import { LoginRateLimiter } from '../utils/loginRateLimiter';
import { ensureCashDaysTable } from '../db/cashDays';
import { migrateAuth } from '../db/auth';
import { ensureInitialAdmin } from '../db/accounts';
import { PASSWORD_CHANGE_ALLOWED_ROUTES } from '../middleware/auth';
import { createTempDbPath } from '../db/scripts/__tests__/dbTestUtils';

// Accounts screen and password change (D-064), end to end through HTTP: real SQLite file, real
// Express app. Every username and password is generated here (public repository).
const { dbPath, cleanup } = createTempDbPath('test-accounts-app');
const previousPath = process.env.DATABASE_PATH;
const fake = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
// Every generated password, to check that none appears in the logs nor in an answer.
const secrets: string[] = [];
const secret = () => {
  const value = fake('secret');
  secrets.push(value);
  return value;
};
const ADMIN = 'chef';
const PASSWORD = secret();

const logLines: string[] = [];
const logger = pino(
  { level: 'debug' },
  new Writable({
    write(chunk: Buffer, _encoding, done) {
      logLines.push(chunk.toString());
      done();
    },
  })
);

let server: Server;
let baseUrl: string;

const withDb = async <T>(fn: (db: Awaited<ReturnType<typeof open>>) => Promise<T>) => {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  try {
    return await fn(db);
  } finally {
    await db.close();
  }
};

type Reply = { status: number; body: unknown; cookies: string[]; text: string };

async function call(
  method: string,
  route: string,
  options: { body?: unknown; cookie?: string } = {}
): Promise<Reply> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.cookie) headers.Cookie = options.cookie;
  const res = await fetch(baseUrl + route, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: res.status, body, cookies: res.headers.getSetCookie(), text };
}

const replies: Reply[] = [];
async function login(username: string, password: string): Promise<string> {
  const reply = await call('POST', '/api/auth/login', { body: { username, password } });
  replies.push(reply);
  if (reply.status !== 200) throw new Error(`login ${username} -> ${reply.status}`);
  return reply.cookies[0].split(';')[0];
}

let adminCookie: string;
const api = async (method: string, route: string, body?: unknown, cookie = adminCookie) => {
  const reply = await call(method, API_ROUTE + route, { body, cookie });
  replies.push(reply);
  return reply;
};

/** Creates an account through the API (temporary password) and returns it. */
async function createAccount(role: 'admin' | 'manager' | 'cashier', password = secret()) {
  const username = fake('u');
  const reply = await api('POST', '/users', { username, password, role });
  expect(reply.status).toBe(201);
  return { ...(reply.body as UserAccountType), password };
}

/** Logs in and changes the temporary password: an account ready to use. */
async function readyAccount(role: 'admin' | 'manager' | 'cashier') {
  const account = await createAccount(role);
  const cookie = await login(account.username, account.password);
  const password = secret();
  const changed = await call('POST', '/api/auth/password', {
    cookie,
    body: { currentPassword: account.password, newPassword: password },
  });
  expect(changed.status).toBe(200);
  return { ...account, password, cookie };
}

const sessionsOf = (id: number) =>
  withDb(async (db) => {
    const row = await db.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?',
      [id]
    );
    return row?.n ?? 0;
  });

beforeAll(async () => {
  process.env.DATABASE_PATH = dbPath;
  await withDb(async (db) => {
    await db.exec(`
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT INTO settings VALUES ('currency', 'TOKEN');
      CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon TEXT);
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price INTEGER NOT NULL,
        category_id INTEGER NOT NULL, icon TEXT
      );
    `);
    await ensureCashDaysTable(db);
    await db.exec(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL, cash_amount INTEGER,
        card_amount INTEGER, cash_day_id INTEGER REFERENCES cash_days (id)
      );
      CREATE TABLE order_items (
        order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL,
        discountedAmount INTEGER NOT NULL DEFAULT 0, product_name TEXT, product_price INTEGER,
        category_name TEXT, PRIMARY KEY (order_id, product_id)
      );
    `);
    await migrateAuth(db);
    await ensureInitialAdmin(db, {
      INITIAL_ADMIN_USERNAME: ADMIN,
      INITIAL_ADMIN_PASSWORD: PASSWORD,
    });
  });
  const app = createApp({
    currency: 'TOKEN',
    clientName: '',
    env: { NODE_ENV: 'development', FRONTEND_URL: 'http://localhost:5173' },
    logger,
    authService: new AuthService(new LoginRateLimiter()),
  });
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    });
  });
  adminCookie = await login(ADMIN, PASSWORD);
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (previousPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = previousPath;
  cleanup();
});

describe('accounts: rights', () => {
  it('answers 401 without a session and 403 without the "users" permission', async () => {
    expect((await call('GET', '/api/users')).status).toBe(401);
    for (const role of ['manager', 'cashier'] as const) {
      const { cookie } = await readyAccount(role);
      for (const [method, route] of [
        ['GET', '/users'],
        ['POST', '/users'],
        ['PATCH', '/users/1'],
        ['POST', '/users/1/reset-password'],
      ]) {
        const reply = await api(method, route, method === 'GET' ? undefined : {}, cookie);
        expect([role, method, route, reply.status]).toEqual([role, method, route, 403]);
        expect(reply.body).toMatchObject({ code: 'FORBIDDEN' });
      }
    }
  });

  it('applies a new role to the next request of an open session (D-063 point 15)', async () => {
    const account = await readyAccount('cashier');
    expect((await api('GET', '/users', undefined, account.cookie)).status).toBe(403);
    expect((await api('PATCH', `/users/${account.id}`, { role: 'admin' })).status).toBe(200);
    expect((await api('GET', '/users', undefined, account.cookie)).status).toBe(200);
    expect((await api('PATCH', `/users/${account.id}`, { role: 'cashier' })).status).toBe(200);
    expect((await api('GET', '/users', undefined, account.cookie)).status).toBe(403);
  });
});

describe('accounts: creation (answer 3 a)', () => {
  it('creates an account with a temporary password, without any hash in the answer', async () => {
    const username = fake('Nouveau');
    const password = secret();
    const reply = await api('POST', '/users', {
      username: ` ${username} `,
      password,
      role: 'cashier',
    });
    expect(reply.status).toBe(201);
    expect(reply.body).toEqual({
      id: expect.any(Number),
      username,
      role: 'cashier',
      active: true,
      mustChangePassword: true,
    });
    expect(reply.text).not.toContain(password);
    expect(reply.text).not.toContain('scrypt');
  });

  it('refuses a username already taken, case ignored (409)', async () => {
    const { username } = await createAccount('cashier');
    const reply = await api('POST', '/users', {
      username: username.toUpperCase(),
      password: secret(),
      role: 'cashier',
    });
    expect(reply.status).toBe(409);
    expect(reply.body).toMatchObject({ code: 'USERNAME_TAKEN' });
  });

  it.each([
    [{ username: 'ab', password: 'secret1', role: 'cashier' }, 'USERNAME_INVALID'],
    [{ username: 'élodie', password: 'secret1', role: 'cashier' }, 'USERNAME_INVALID'],
    [{ username: 'abc', password: '12345', role: 'cashier' }, 'PASSWORD_INVALID'],
    [{ username: 'abc', password: 'x'.repeat(257), role: 'cashier' }, 'PASSWORD_INVALID'],
    [{ username: 'abc', password: 'secret1' }, 'ROLE_INVALID'],
    [{ username: 'abc', password: 'secret1', role: 'owner' }, 'ROLE_INVALID'],
  ])('refuses %j with %s (400)', async (body, code) => {
    const reply = await api('POST', '/users', body);
    expect(reply.status).toBe(400);
    expect(reply.body).toMatchObject({ code });
  });

  it('lists active accounts first, then by username, case ignored (answer 7 a)', async () => {
    const off = await createAccount('cashier');
    expect((await api('PATCH', `/users/${off.id}`, { active: false })).status).toBe(200);
    const list = (await api('GET', '/users')).body as UserAccountType[];
    const firstDisabled = list.findIndex((account) => !account.active);
    expect(firstDisabled).toBeGreaterThan(0);
    expect(list.slice(firstDisabled).every((account) => !account.active)).toBe(true);
    const names = list.slice(0, firstDisabled).map((account) => account.username.toLowerCase());
    expect(names).toEqual([...names].sort());
    expect(JSON.stringify(list)).not.toContain('scrypt');
  });
});

describe('accounts: role and state', () => {
  it("refuses to deactivate or demote one's own account (409 SELF_ACCOUNT_CHANGE)", async () => {
    const me = ((await api('GET', '/auth/me')).body as { user: { id: number } }).user.id;
    for (const body of [{ active: false }, { role: 'cashier' }]) {
      const reply = await api('PATCH', `/users/${me}`, body);
      expect(reply.status).toBe(409);
      expect(reply.body).toMatchObject({ code: 'SELF_ACCOUNT_CHANGE' });
    }
  });

  it('deactivates (sessions closed, login refused), then reactivates with the same password', async () => {
    const account = await readyAccount('cashier');
    expect(await sessionsOf(account.id)).toBe(1);
    const off = await api('PATCH', `/users/${account.id}`, { active: false });
    expect(off.status).toBe(200);
    expect(off.body).toMatchObject({ active: false });
    expect(await sessionsOf(account.id)).toBe(0);
    expect((await api('GET', '/auth/me', undefined, account.cookie)).status).toBe(401);
    await expect(login(account.username, account.password)).rejects.toThrow('401');

    const on = await api('PATCH', `/users/${account.id}`, { active: true });
    expect(on.body).toMatchObject({ active: true, mustChangePassword: false });
    await expect(login(account.username, account.password)).resolves.toMatch(/^cc_session=/);
  });

  it('refuses an unknown role, a non-boolean state, an empty body and an unknown id', async () => {
    const account = await createAccount('cashier');
    expect((await api('PATCH', `/users/${account.id}`, { role: 'owner' })).body).toMatchObject({
      code: 'ROLE_INVALID',
    });
    expect((await api('PATCH', `/users/${account.id}`, { active: 'no' })).status).toBe(400);
    expect((await api('PATCH', `/users/${account.id}`, {})).status).toBe(400);
    expect((await api('PATCH', '/users/99999', { active: false })).status).toBe(404);
    expect((await api('PATCH', '/users/abc', { active: false })).status).toBe(400);
  });
});

describe('accounts: last active admin (answer 8 a)', () => {
  /** Leaves `keep` as the only active admins; returns a function that puts the others back. */
  const onlyAdmins = async (...keep: number[]) => {
    const others = await withDb(async (db) => {
      const rows = await db.all<{ id: number }[]>(
        "SELECT id FROM users WHERE role = 'admin' AND active = 1"
      );
      const ids = rows.map((row) => row.id).filter((id) => !keep.includes(id));
      for (const id of ids) await db.run("UPDATE users SET role = 'manager' WHERE id = ?", [id]);
      return ids;
    });
    return () =>
      withDb(async (db) => {
        for (const id of others) await db.run("UPDATE users SET role = 'admin' WHERE id = ?", [id]);
      });
  };

  it('refuses to deactivate or demote the only active admin, with the exact message', async () => {
    const restore = await onlyAdmins(1);
    // Through the service: through HTTP, the only active admin can only be oneself.
    const service = new UserService();
    for (const input of [{ active: false }, { role: 'cashier' }]) {
      await expect(service.update(999_999, 1, input)).rejects.toMatchObject({
        code: 'LAST_ACTIVE_ADMIN',
        message: LAST_ACTIVE_ADMIN_MESSAGE,
      });
    }
    await restore();
  });

  it('keeps one admin when two admins demote each other at the same time', async () => {
    const a = await readyAccount('admin');
    const b = await readyAccount('admin');
    const restore = await onlyAdmins(a.id, b.id);
    const [ab, ba] = await Promise.all([
      api('PATCH', `/users/${b.id}`, { active: false }, a.cookie),
      api('PATCH', `/users/${a.id}`, { role: 'cashier' }, b.cookie),
    ]);
    const statuses = [ab.status, ba.status].sort();
    // One wins; the other is refused (409 last admin, or 401/403 if its session lost the right).
    expect(statuses[0]).toBe(200);
    expect(statuses[1]).not.toBe(200);
    const admins = await withDb((db) =>
      db.get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1")
    );
    expect(admins?.n).toBe(1);
    await withDb((db) =>
      db.run("UPDATE users SET role = 'admin', active = 1 WHERE id IN (?, ?)", [a.id, b.id])
    );
    await restore();
  });
});

describe('accounts: password reset (answers 2 a, 12 a, 13 b)', () => {
  it('sets a temporary password and closes every session of the account', async () => {
    const account = await readyAccount('cashier');
    const temporary = secret();
    const reply = await api('POST', `/users/${account.id}/reset-password`, { password: temporary });
    expect(reply.status).toBe(200);
    expect(reply.body).toMatchObject({ mustChangePassword: true });
    expect(reply.text).not.toContain(temporary);
    expect(await sessionsOf(account.id)).toBe(0);
    expect((await api('GET', '/auth/me', undefined, account.cookie)).status).toBe(401);
    await expect(login(account.username, account.password)).rejects.toThrow('401');
    await expect(login(account.username, temporary)).resolves.toMatch(/^cc_session=/);
  });

  it("refuses one's own account, a disabled account and a short password", async () => {
    const me = ((await api('GET', '/auth/me')).body as { user: { id: number } }).user.id;
    const self = await api('POST', `/users/${me}/reset-password`, { password: secret() });
    expect(self.status).toBe(409);
    expect(self.body).toMatchObject({ code: 'SELF_PASSWORD_RESET' });

    const account = await createAccount('cashier');
    await api('PATCH', `/users/${account.id}`, { active: false });
    const disabled = await api('POST', `/users/${account.id}/reset-password`, {
      password: secret(),
    });
    expect(disabled.status).toBe(409);
    expect(disabled.body).toMatchObject({ code: 'ACCOUNT_DISABLED' });

    const short = await api('POST', `/users/${account.id}/reset-password`, { password: '12345' });
    expect(short.status).toBe(400);
    expect(short.body).toMatchObject({ code: 'PASSWORD_INVALID' });
  });
});

describe('temporary password: everything else is blocked', () => {
  it('answers 403 PASSWORD_CHANGE_REQUIRED on every route but me, logout and password', async () => {
    const account = await createAccount('admin');
    const cookie = await login(account.username, account.password);
    const me = await api('GET', '/auth/me', undefined, cookie);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ user: { mustChangePassword: true } });

    const routes: [string, string][] = [['GET', '/api/not-a-route']];
    for (const controller of createApiControllers()) {
      for (const layer of (controller.router as unknown as { stack: RouterLayer[] }).stack) {
        if (!layer.route) continue;
        const path = layer.route.path.replace(/:[A-Za-z]+/g, '1');
        for (const method of Object.keys(layer.route.methods)) {
          routes.push([method.toUpperCase(), API_ROUTE + controller.path + path]);
        }
      }
    }
    expect(routes.some(([, route]) => route.startsWith('/api/users'))).toBe(true);
    for (const [method, route] of routes) {
      const reply = await call(method, route, { cookie, body: method === 'GET' ? undefined : {} });
      expect([method, route, reply.status]).toEqual([method, route, 403]);
      expect(reply.body).toMatchObject({ code: 'PASSWORD_CHANGE_REQUIRED' });
    }
    expect([...PASSWORD_CHANGE_ALLOWED_ROUTES]).toEqual([
      'GET /api/auth/me',
      'POST /api/auth/logout',
      'POST /api/auth/password',
    ]);

    // Changing it unblocks the same session at once.
    const changed = await call('POST', '/api/auth/password', {
      cookie,
      body: { currentPassword: account.password, newPassword: secret() },
    });
    expect(changed.status).toBe(200);
    expect(changed.body).toMatchObject({ user: { mustChangePassword: false } });
    expect((await api('GET', '/categories', undefined, cookie)).status).toBe(200);
  });

  it('still lets the account log out', async () => {
    const account = await createAccount('cashier');
    const cookie = await login(account.username, account.password);
    expect((await api('POST', '/auth/logout', undefined, cookie)).status).toBe(204);
    expect((await api('GET', '/auth/me', undefined, cookie)).status).toBe(401);
  });
});

describe('own password (answers 4 a and 5 a)', () => {
  it('keeps the session in use and closes the other ones', async () => {
    const account = await readyAccount('cashier');
    const other = await login(account.username, account.password);
    expect(await sessionsOf(account.id)).toBe(2);
    const next = secret();
    const reply = await call('POST', '/api/auth/password', {
      cookie: account.cookie,
      body: { currentPassword: account.password, newPassword: next },
    });
    expect(reply.status).toBe(200);
    expect(reply.text).not.toContain(next);
    expect(await sessionsOf(account.id)).toBe(1);
    expect((await api('GET', '/auth/me', undefined, account.cookie)).status).toBe(200);
    expect((await api('GET', '/auth/me', undefined, other)).status).toBe(401);
    await expect(login(account.username, next)).resolves.toMatch(/^cc_session=/);
  });

  it('refuses a wrong current password, the same password and a short one', async () => {
    const account = await readyAccount('cashier');
    const change = (currentPassword: string, newPassword: string) =>
      call('POST', '/api/auth/password', {
        cookie: account.cookie,
        body: { currentPassword, newPassword },
      });
    const wrong = await change('not-the-password', secret());
    expect(wrong.status).toBe(400);
    expect(wrong.body).toMatchObject({ code: 'WRONG_PASSWORD' });
    expect((await change(account.password, account.password)).body).toMatchObject({
      code: 'SAME_PASSWORD',
    });
    expect((await change(account.password, '12345')).body).toMatchObject({
      code: 'PASSWORD_INVALID',
    });
    expect((await change('x'.repeat(10_000), secret())).body).toMatchObject({
      code: 'WRONG_PASSWORD',
    });
    // The temporary password cannot be kept either.
    const fresh = await createAccount('cashier');
    const cookie = await login(fresh.username, fresh.password);
    const same = await call('POST', '/api/auth/password', {
      cookie,
      body: { currentPassword: fresh.password, newPassword: fresh.password },
    });
    expect(same.body).toMatchObject({ code: 'SAME_PASSWORD' });
  });

  it('waits 1 minute after 5 wrong current passwords, without blocking the login', async () => {
    const account = await readyAccount('cashier');
    const change = (currentPassword: string) =>
      call('POST', '/api/auth/password', {
        cookie: account.cookie,
        body: { currentPassword, newPassword: secret() },
      });
    for (let i = 1; i <= 4; i++) expect((await change(`wrong-${i}`)).status).toBe(400);
    const fifth = await change('wrong-5');
    expect(fifth.status).toBe(429);
    expect(fifth.body).toMatchObject({ code: 'TOO_MANY_ATTEMPTS', retryAfterSeconds: 60 });
    expect((await change(account.password)).status).toBe(429);
    await expect(login(account.username, account.password)).resolves.toMatch(/^cc_session=/);
  });
});

describe('logs and answers', () => {
  it('never hold a password, a hash or a request body of these routes', async () => {
    const hashes = await withDb((db) =>
      db.all<{ password_hash: string }[]>('SELECT password_hash FROM users')
    );
    const output = logLines.join('');
    expect(output).toContain('/api/users');
    expect(output).toContain('/api/auth/password');
    expect(output).not.toContain('currentPassword');
    expect(output).not.toContain('newPassword');
    expect(secrets.length).toBeGreaterThan(20);
    for (const secret of [PASSWORD, ...secrets]) {
      expect(output).not.toContain(secret);
      for (const reply of replies) expect(reply.text).not.toContain(secret);
    }
    for (const { password_hash } of hashes) {
      const key = password_hash.split('$')[5];
      expect(output).not.toContain(key);
      for (const reply of replies) expect(reply.text).not.toContain(key);
    }
  });
});

type RouterLayer = { route?: { path: string; methods: Record<string, boolean> } };
