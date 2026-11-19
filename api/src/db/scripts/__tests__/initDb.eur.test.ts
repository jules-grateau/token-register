import fs from 'fs';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const tempDbPath = path.join(os.tmpdir(), `test-db-eur-${Date.now()}.sqlite`);
const previousCurrency = process.env.CURRENCY;

beforeAll(() => {
  process.env.DATABASE_PATH = tempDbPath;
  process.env.CURRENCY = 'EUR';
  if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
});

afterAll(() => {
  if (previousCurrency === undefined) delete process.env.CURRENCY;
  else process.env.CURRENCY = previousCurrency;
  if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
});

it('starts a new EUR instance with an empty catalog (D-014)', async () => {
  await import('../initDb');
  await new Promise((resolve) => setTimeout(resolve, 1000));

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
