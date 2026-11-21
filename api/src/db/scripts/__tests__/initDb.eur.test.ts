import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../../../utils/logger';
import {
  createTempDbPath,
  hasAppTables,
  waitFor,
  wasLogged,
  SEED_DECISION_MESSAGES,
} from './dbTestUtils';

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-eur');
const previousCurrency = process.env.CURRENCY;

beforeAll(() => {
  process.env.DATABASE_PATH = tempDbPath;
  process.env.CURRENCY = 'EUR';
});

afterAll(() => {
  if (previousCurrency === undefined) delete process.env.CURRENCY;
  else process.env.CURRENCY = previousCurrency;
  cleanup();
});

it('starts a new EUR instance with an empty catalog (D-014)', async () => {
  const infoSpy = jest.spyOn(logger, 'info');
  await import('../initDb');
  await waitFor(() => wasLogged(infoSpy, SEED_DECISION_MESSAGES), 'initDb to decide on seeding');
  await waitFor(() => hasAppTables(tempDbPath), 'initDb to create the tables');

  const db = await open({ filename: tempDbPath, driver: sqlite3.Database });
  try {
    const categories = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM categories');
    const products = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM products');
    expect(categories?.count).toBe(0);
    expect(products?.count).toBe(0);
  } finally {
    await db.close();
  }
});
