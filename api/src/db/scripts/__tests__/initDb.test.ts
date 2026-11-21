import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../../../utils/logger';
import {
  createTempDbPath,
  hasAppTables,
  listTables,
  waitFor,
  wasLogged,
  APP_TABLES,
  SEED_DECISION_MESSAGES,
} from './dbTestUtils';

// Above the 10 s of waitFor, so that its explicit message is the one reported (TL-1).
jest.setTimeout(15000);

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-init');
let infoSpy: jest.SpyInstance;
const previousCurrency = process.env.CURRENCY;

beforeAll(() => {
  infoSpy = jest.spyOn(logger, 'info');
  process.env.DATABASE_PATH = tempDbPath;
  delete process.env.CURRENCY; // token instance
});

afterAll(() => {
  infoSpy.mockRestore();
  if (previousCurrency === undefined) delete process.env.CURRENCY;
  else process.env.CURRENCY = previousCurrency;
  cleanup();
});

async function readCatalog() {
  const db = await open({ filename: tempDbPath, driver: sqlite3.Database });
  try {
    const categories = await db.all<{ id: number; name: string }[]>(
      'SELECT id, name FROM categories ORDER BY id'
    );
    const products = await db.all<{ name: string; price: number; category_id: number }[]>(
      'SELECT name, price, category_id FROM products ORDER BY id'
    );
    return { categories, products };
  } finally {
    await db.close();
  }
}

// First run on a new database. Waited for here: clearMocks resets the spy before each test.
beforeAll(async () => {
  await import('../initDb');
  await waitFor(() => hasAppTables(tempDbPath), 'initDb to create the tables');
  // Let the script finish before the temporary directory is removed.
  await waitFor(() => wasLogged(infoSpy, SEED_DECISION_MESSAGES), 'initDb to decide on seeding');
  // Logged only once every insert has completed (issue #52).
  expect(wasLogged(infoSpy, ['Categories and products inserted'])).toBe(true);
});

it('should create all tables', async () => {
  expect(await listTables(tempDbPath)).toEqual(expect.arrayContaining(APP_TABLES));
});

it('seeds the whole sample catalog on a new token instance (issue #52)', async () => {
  const { categories, products } = await readCatalog();
  expect(categories.map((category) => category.name)).toEqual([
    'Boissons',
    'Salé',
    'Sucré',
    'Eco-cup',
  ]);
  expect(products).toHaveLength(15);
  expect(products).toContainEqual({ name: 'Bière', price: 3, category_id: 1 });
  expect(products).toContainEqual({ name: 'Retour Eco-cup', price: -1, category_id: 4 });
});

it('does not insert the sample catalog again on a populated database', async () => {
  // Second run of the script, in a fresh module registry (the module runs on import).
  let rerunSpy: jest.SpyInstance | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const isolatedLogger = require('../../../utils/logger').default;
    rerunSpy = jest.spyOn(isolatedLogger, 'info');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../initDb');
  });
  await waitFor(
    () => wasLogged(rerunSpy!, ['Database is already populated']),
    'initDb to skip seeding'
  );

  const { categories, products } = await readCatalog();
  expect(categories).toHaveLength(4);
  expect(products).toHaveLength(15);
});
