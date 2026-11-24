import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import {
  ensureCashDaysTable,
  getOpenCashDayId,
  hasOrderCashDayColumn,
  migrateCashDays,
} from '../cashDays';

// Schema of a database created before the cash days (2.3.x).
async function createLegacyDb(): Promise<Database> {
  const db = await open({ filename: ':memory:', driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL,
      cash_amount INTEGER, card_amount INTEGER
    );
    CREATE TABLE order_items (
      order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL,
      discountedAmount INTEGER NOT NULL DEFAULT 0, product_name TEXT, product_price INTEGER,
      category_name TEXT, PRIMARY KEY (order_id, product_id)
    );
    INSERT INTO orders (id, date) VALUES (1, 1700000000000), (2, 1700000001000);
    INSERT INTO order_items (order_id, product_id, quantity, product_price) VALUES (1, 1, 2, 3), (2, 1, 1, 3);
  `);
  return db;
}

const count = async (db: Database, table: string) =>
  (await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))?.n;

describe('cash days migration (D-061)', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createLegacyDb();
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds the table and the column, and deletes the orders placed before (answer 18 b)', async () => {
    expect(await hasOrderCashDayColumn(db)).toBe(false);

    expect(await migrateCashDays(db)).toEqual({ columnAdded: true, deletedOrders: 2 });

    expect(await hasOrderCashDayColumn(db)).toBe(true);
    expect(await count(db, 'orders')).toBe(0);
    expect(await count(db, 'order_items')).toBe(0);
    expect(await count(db, 'cash_days')).toBe(0);
  });

  it('is idempotent: a second run deletes nothing', async () => {
    await migrateCashDays(db);
    await db.exec('INSERT INTO cash_days (opened_at) VALUES (1)');
    await db.exec('INSERT INTO orders (date, cash_day_id) VALUES (2, 1)');

    expect(await migrateCashDays(db)).toEqual({ columnAdded: false, deletedOrders: 0 });
    expect(await count(db, 'orders')).toBe(1);
  });

  it('deletes nothing on a database that already has the column (new database)', async () => {
    await db.exec('ALTER TABLE orders ADD COLUMN cash_day_id INTEGER');
    expect(await migrateCashDays(db)).toEqual({ columnAdded: false, deletedOrders: 0 });
    expect(await count(db, 'orders')).toBe(2);
  });

  it('refuses a second open day at the database level', async () => {
    await ensureCashDaysTable(db);
    await db.exec('INSERT INTO cash_days (opened_at) VALUES (1)');
    await expect(db.exec('INSERT INTO cash_days (opened_at) VALUES (2)')).rejects.toThrow(
      'UNIQUE constraint failed'
    );
    expect(await getOpenCashDayId(db)).toBe(1);

    // Closed days do not count: a new day can be opened after the close.
    await db.exec('UPDATE cash_days SET closed_at = 3 WHERE id = 1');
    expect(await getOpenCashDayId(db)).toBeNull();
    await db.exec('INSERT INTO cash_days (opened_at) VALUES (4)');
    await db.exec('UPDATE cash_days SET closed_at = 5 WHERE id = 2');
    await db.exec('INSERT INTO cash_days (opened_at) VALUES (6)');
    expect(await getOpenCashDayId(db)).toBe(3);
  });
});
