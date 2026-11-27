import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { Writable } from 'stream';
import pino from 'pino';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createApiControllers, createApp, API_ROUTE } from '../app';
import { AuthService, SESSION_IDLE_MS } from '../services/auth.service';
import { LoginRateLimiter } from '../utils/loginRateLimiter';
import { ensureCashDaysTable } from '../db/cashDays';
import { migrateAuth } from '../db/auth';
import { ensureInitialAdmin } from '../db/accounts';
import { createTempDbPath } from '../db/scripts/__tests__/dbTestUtils';

// End to end through HTTP (D-063): real SQLite file, real Express app, generated credentials.
const { dbPath, cleanup } = createTempDbPath('test-auth-app');
const previousPath = process.env.DATABASE_PATH;
const ADMIN = 'chef';
const PASSWORD = `pw-${Math.random().toString(36).slice(2)}-x`;
const FRONTEND = 'http://localhost:5173';

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

async function createSchema() {
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
      INSERT INTO categories (id, name) VALUES (1, 'Buvette');
      INSERT INTO products (id, name, price, category_id) VALUES (1, 'Café', 2, 1);
    `);
    await migrateAuth(db);
    await ensureInitialAdmin(db, {
      INITIAL_ADMIN_USERNAME: ADMIN,
      INITIAL_ADMIN_PASSWORD: PASSWORD,
    });
  });
}

type Reply = { status: number; body: unknown; cookies: string[]; headers: Headers };

async function call(
  method: string,
  route: string,
  options: { body?: unknown; raw?: string; cookie?: string; origin?: string } = {}
): Promise<Reply> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined || options.raw !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.cookie) headers.Cookie = options.cookie;
  if (options.origin) headers.Origin = options.origin;
  const res = await fetch(baseUrl + route, {
    method,
    headers,
    body: options.raw ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: res.status, body, cookies: res.headers.getSetCookie(), headers: res.headers };
}

const cookieOf = (reply: Reply) => reply.cookies[0]?.split(';')[0] ?? '';

async function login(username = ADMIN, password = PASSWORD) {
  const reply = await call('POST', '/api/auth/login', { body: { username, password } });
  return { reply, cookie: cookieOf(reply) };
}

function startServer(env: NodeJS.ProcessEnv) {
  const app = createApp({
    currency: 'TOKEN',
    clientName: '',
    env,
    logger,
    authService: new AuthService(new LoginRateLimiter()),
  });
  return new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    });
  });
}

const stopServer = () => new Promise<void>((resolve) => server.close(() => resolve()));

beforeAll(async () => {
  process.env.DATABASE_PATH = dbPath;
  await createSchema();
});

afterAll(() => {
  if (previousPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = previousPath;
  cleanup();
});

describe('API behind the login (development settings)', () => {
  beforeAll(() => startServer({ NODE_ENV: 'development', FRONTEND_URL: FRONTEND }));
  afterAll(stopServer);

  it('answers 401 without a session on every /api route, except the login', async () => {
    const routes: [string, string][] = [
      ['GET', '/api/auth/me'],
      ['POST', '/api/auth/logout'],
      ['GET', '/api/not-a-route'],
    ];
    for (const controller of createApiControllers()) {
      for (const layer of (controller.router as unknown as { stack: RouterLayer[] }).stack) {
        if (!layer.route) continue;
        const path = layer.route.path.replace(/:[A-Za-z]+/g, '1');
        for (const method of Object.keys(layer.route.methods)) {
          routes.push([method.toUpperCase(), API_ROUTE + controller.path + path]);
        }
      }
    }
    expect(routes.length).toBeGreaterThan(15);
    for (const [method, route] of routes) {
      const reply = await call(method, route, method === 'GET' ? {} : { body: {} });
      expect([method, route, reply.status]).toEqual([method, route, 401]);
      expect(reply.body).toMatchObject({ code: 'UNAUTHENTICATED' });
    }
  });

  it('refuses a wrong password and an unknown account with the same answer (answer 6 a)', async () => {
    const wrong = await login(ADMIN, 'not-the-password');
    const unknown = await login('nobody', PASSWORD);
    expect(wrong.reply.status).toBe(401);
    expect(unknown.reply.status).toBe(401);
    expect(wrong.reply.body).toEqual(unknown.reply.body);
    expect(wrong.reply.body).toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(wrong.reply.cookies).toEqual([]);
  });

  it('logs in (any case, spaces trimmed), sets a strict httpOnly cookie, then serves /api', async () => {
    const { reply, cookie } = await login('  CHEF ');
    expect(reply.status).toBe(200);
    expect(reply.body).toEqual({
      user: {
        id: 1,
        username: ADMIN,
        role: 'admin',
        permissions: expect.arrayContaining([
          'sale',
          'catalog',
          'cash_day',
          'order_delete',
          'users',
        ]),
        mustChangePassword: false,
      },
    });
    const [setCookie] = reply.cookies;
    expect(setCookie).toMatch(/^cc_session=[A-Za-z0-9_-]{40,};/);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain('Max-Age=604800');
    expect(setCookie).not.toContain('Secure');
    expect(setCookie).not.toContain(PASSWORD);

    expect((await call('GET', '/api/auth/me', { cookie })).body).toEqual(reply.body);
    expect((await call('GET', '/api/categories', { cookie })).status).toBe(200);

    // A new token at each login.
    expect((await login()).cookie).not.toBe(cookie);
  });

  it('stores only a hash of the session token', async () => {
    const { cookie } = await login();
    const token = cookie.split('=')[1];
    const rows = await withDb((db) =>
      db.all<{ token_hash: string }[]>('SELECT token_hash FROM sessions')
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.token_hash === token)).toBe(false);
  });

  it('logs out: the session is closed and the cookie cleared with the same attributes', async () => {
    const { cookie } = await login();
    const reply = await call('POST', '/api/auth/logout', { cookie });
    expect(reply.status).toBe(204);
    expect(reply.cookies[0]).toMatch(/^cc_session=;/);
    expect(reply.cookies[0]).toContain('HttpOnly');
    expect(reply.cookies[0]).toContain('SameSite=Strict');
    expect((await call('GET', '/api/auth/me', { cookie })).status).toBe(401);
  });

  it('records the author of an order and of the cash day (point 14)', async () => {
    const { cookie } = await login();
    const day = await call('POST', '/api/cash-days', { cookie });
    expect(day.status).toBe(201);
    const order = await call('POST', '/api/orders', {
      cookie,
      body: {
        items: [
          {
            product: { id: 1, name: '', price: 2, categoryId: 1 },
            quantity: 1,
            discountedAmount: 0,
          },
        ],
      },
    });
    expect(order.status).toBe(201);
    expect((await call('POST', '/api/cash-days/current/close', { cookie })).status).toBe(200);
    const { id: orderId } = order.body as { id: number };
    const { id: dayId } = day.body as { id: number };
    await withDb(async (db) => {
      expect(await db.get('SELECT created_by FROM orders WHERE id = ?', [orderId])).toEqual({
        created_by: 1,
      });
      expect(
        await db.get('SELECT opened_by, closed_by FROM cash_days WHERE id = ?', [dayId])
      ).toEqual({
        opened_by: 1,
        closed_by: 1,
      });
    });
  });

  it('applies a role change at once, and refuses a role without the permission (points 13, 15)', async () => {
    await withDb((db) =>
      db.exec(`
        INSERT OR IGNORE INTO roles (name) VALUES ('test_seller');
        INSERT OR IGNORE INTO role_permissions VALUES ('test_seller', 'sale');
        INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
          SELECT 2, 'caisse', password_hash, 'cashier', 0, 0 FROM users WHERE id = 1;
      `)
    );
    const { cookie } = await login('caisse');
    const create = () => call('POST', '/api/categories', { cookie, body: { name: 'Snacks' } });
    expect((await create()).status).toBe(201);

    await withDb((db) => db.run("UPDATE users SET role = 'test_seller' WHERE id = 2"));
    const refused = await create();
    expect(refused.status).toBe(403);
    expect(refused.body).toMatchObject({ code: 'FORBIDDEN' });
    expect((await call('GET', '/api/categories', { cookie })).status).toBe(200);

    // Unknown role: no permission at all (fail closed).
    await withDb((db) => db.run("UPDATE users SET role = 'ghost' WHERE id = 2"));
    expect((await call('GET', '/api/categories', { cookie })).status).toBe(403);
    expect((await call('GET', '/api/auth/me', { cookie })).body).toMatchObject({
      user: { permissions: [] },
    });
  });

  it('closes the sessions of a disabled account at once, and refuses its login (point 11)', async () => {
    await withDb((db) =>
      db.exec(`
        INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
          SELECT 3, 'parti', password_hash, 'cashier', 0, 0 FROM users WHERE id = 1;
      `)
    );
    const { cookie } = await login('parti');
    expect((await call('GET', '/api/auth/me', { cookie })).status).toBe(200);
    await withDb((db) => db.run('UPDATE users SET active = 0 WHERE id = 3'));
    expect((await call('GET', '/api/auth/me', { cookie })).status).toBe(401);
    const again = await login('parti');
    expect(again.reply.status).toBe(401);
    expect(again.reply.body).toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('ends a session after 7 days without any request (point 4)', async () => {
    const { cookie } = await login();
    await withDb((db) =>
      db.run('UPDATE sessions SET last_seen_at = ?', [Date.now() - SESSION_IDLE_MS - 1000])
    );
    expect((await call('GET', '/api/auth/me', { cookie })).status).toBe(401);
  });

  it('extends the session at most once an hour, sending the cookie again', async () => {
    const { cookie } = await login();
    expect((await call('GET', '/api/auth/me', { cookie })).cookies).toEqual([]);
    await withDb((db) =>
      db.run('UPDATE sessions SET last_seen_at = ?', [Date.now() - 2 * 3600_000])
    );
    const reply = await call('GET', '/api/auth/me', { cookie });
    expect(reply.status).toBe(200);
    expect(reply.cookies[0]).toContain('Max-Age=604800');
  });

  it('makes the 5th failure wait 1 minute, even with the right password next (point 7)', async () => {
    await withDb((db) =>
      db.exec(`
        INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
          SELECT 4, 'essai', password_hash, 'cashier', 0, 0 FROM users WHERE id = 1;
      `)
    );
    for (let i = 1; i <= 4; i++) {
      expect((await login('essai', 'wrong-password')).reply.status).toBe(401);
    }
    const fifth = await login('ESSAI', 'wrong-password');
    expect(fifth.reply.status).toBe(429);
    expect(fifth.reply.body).toMatchObject({ code: 'TOO_MANY_ATTEMPTS', retryAfterSeconds: 60 });
    expect(fifth.reply.headers.get('retry-after')).toBe('60');
    expect((await login('essai')).reply.status).toBe(429);
    // Another account from the same IP is not blocked.
    expect((await login()).reply.status).toBe(200);
  });

  it('refuses a write from another origin, accepts FRONTEND_URL and no Origin (answer 11 a)', async () => {
    const { cookie } = await login();
    const body = { name: 'Origine' };
    const foreign = await call('POST', '/api/categories', {
      cookie,
      body,
      origin: 'https://evil.example',
    });
    expect(foreign.status).toBe(403);
    expect(foreign.body).toMatchObject({ code: 'ORIGIN_REFUSED' });
    expect(
      (await call('POST', '/api/auth/login', { body: {}, origin: 'https://evil.example' })).status
    ).toBe(403);
    expect((await call('POST', '/api/categories', { cookie, body, origin: FRONTEND })).status).toBe(
      201
    );
    expect((await call('POST', '/api/categories', { cookie, body })).status).toBe(201);
    expect(
      (await call('GET', '/api/categories', { cookie, origin: 'https://evil.example' })).status
    ).toBe(200);
  });

  it('never logs a password, a password hash or a session token', async () => {
    const { cookie } = await login();
    await call('POST', '/api/auth/login', { raw: `{"username":"chef","password":"${PASSWORD}"` });
    await login(ADMIN, `${PASSWORD}-wrong`);
    await call('GET', '/api/auth/me', { cookie });
    await call('POST', '/api/auth/logout', { cookie });

    const hashes = await withDb((db) =>
      db.all<{ password_hash: string }[]>('SELECT password_hash FROM users')
    );
    const output = logLines.join('');
    expect(output).toContain('/api/auth/login');
    expect(output).not.toContain(PASSWORD);
    for (const { password_hash } of hashes)
      expect(output).not.toContain(password_hash.split('$')[5]);
    expect(output).not.toContain(cookie.split('=')[1]);
  });
});

describe('production settings', () => {
  beforeAll(() => startServer({ NODE_ENV: 'production', FRONTEND_URL: FRONTEND }));
  afterAll(stopServer);

  it('serves /config.js without a session', async () => {
    const reply = await call('GET', '/config.js');
    expect(reply.status).toBe(200);
    expect(String(reply.body)).toContain('window.APP_CONFIG');
  });

  it('marks the session cookie Secure (point 3)', async () => {
    const { reply } = await login();
    expect(reply.cookies[0]).toContain('Secure');
  });
});

describe('production settings with COOKIE_SECURE=false (local HTTP QA)', () => {
  beforeAll(() =>
    startServer({ NODE_ENV: 'production', FRONTEND_URL: FRONTEND, COOKIE_SECURE: 'false' })
  );
  afterAll(stopServer);

  it('leaves the Secure flag out', async () => {
    const { reply } = await login();
    expect(reply.status).toBe(200);
    expect(reply.cookies[0]).not.toContain('Secure');
  });
});

type RouterLayer = { route?: { path: string; methods: Record<string, boolean> } };
