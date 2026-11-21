import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../../../utils/logger';
import {
  countCatalog,
  createTempDbPath,
  listTables,
  waitFor,
  wasLogged,
  APP_TABLES,
  INIT_DONE_MESSAGES,
} from './dbTestUtils';

// Above the 10 s of waitFor, so that its explicit message is the one reported (TL-1).
jest.setTimeout(15000);

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-init');
let infoSpy: jest.SpyInstance;
const previousCurrency = process.env.CURRENCY;

beforeAll(async () => {
  infoSpy = jest.spyOn(logger, 'info');
  process.env.DATABASE_PATH = tempDbPath;
  delete process.env.CURRENCY; // token instance

  // First run on a new database. Waited for here: clearMocks resets the spy before each test.
  await import('../initDb');
  await waitFor(() => wasLogged(infoSpy, INIT_DONE_MESSAGES), 'initDb to finish');
});

afterAll(() => {
  infoSpy.mockRestore();
  if (previousCurrency === undefined) delete process.env.CURRENCY;
  else process.env.CURRENCY = previousCurrency;
  cleanup();
});

it('should create all tables', async () => {
  expect(await listTables(tempDbPath)).toEqual(expect.arrayContaining(APP_TABLES));
});

it('starts a new token instance with an empty catalog (D-055)', async () => {
  expect(await countCatalog(tempDbPath)).toEqual({ categories: 0, products: 0 });
});

it('keeps existing data untouched when run again (D-055)', async () => {
  const db = await open({ filename: tempDbPath, driver: sqlite3.Database });
  try {
    await db.exec(`
      INSERT INTO categories (id, name, icon) VALUES (1, 'Boissons', 'beer');
      INSERT INTO products (id, name, price, category_id, icon) VALUES (1, 'Bière', 3, 1, 'beer');
      INSERT INTO orders (id, date) VALUES (1, 1700000000000);
      INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 1, 2);
    `);
  } finally {
    await db.close();
  }

  // Second run of the script, in a fresh module registry (the module runs on import).
  let rerunSpy: jest.SpyInstance | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const isolatedLogger = require('../../../utils/logger').default;
    rerunSpy = jest.spyOn(isolatedLogger, 'info');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../initDb');
  });
  await waitFor(() => wasLogged(rerunSpy!, INIT_DONE_MESSAGES), 'initDb to finish again');

  const check = await open({ filename: tempDbPath, driver: sqlite3.Database });
  try {
    expect(await check.all('SELECT id, name, icon FROM categories')).toEqual([
      { id: 1, name: 'Boissons', icon: 'beer' },
    ]);
    expect(await check.all('SELECT id, name, price, category_id FROM products')).toEqual([
      { id: 1, name: 'Bière', price: 3, category_id: 1 },
    ]);
    expect(await check.all('SELECT order_id, product_id, quantity FROM order_items')).toEqual([
      { order_id: 1, product_id: 1, quantity: 2 },
    ]);
  } finally {
    await check.close();
  }
});
