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

// Above the 10 s of waitFor, so that its explicit message is the one reported (TL-1).
jest.setTimeout(15000);

const { dbPath: tempDbPath, cleanup } = createTempDbPath('test-db-eur');
let infoSpy: jest.SpyInstance;
const previousCurrency = process.env.CURRENCY;

beforeAll(() => {
  infoSpy = jest.spyOn(logger, 'info');
  process.env.DATABASE_PATH = tempDbPath;
  process.env.CURRENCY = 'EUR';
});

afterAll(() => {
  infoSpy.mockRestore();
  if (previousCurrency === undefined) delete process.env.CURRENCY;
  else process.env.CURRENCY = previousCurrency;
  cleanup();
});

it('starts a new EUR instance with an empty catalog (D-014)', async () => {
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
