import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { migrateAuth, ROLE_PERMISSIONS } from '../auth';
import { migrateCashDays } from '../cashDays';

// Schema and data of a 2.4.0 database: a closed day, an open day, orders and their lines.
async function create240Db(): Promise<Database> {
  const db = await open({ filename: ':memory:', driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon TEXT);
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price INTEGER NOT NULL,
      category_id INTEGER NOT NULL, icon TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL, cash_amount INTEGER,
      card_amount INTEGER
    );
    CREATE TABLE order_items (
      order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL,
      discountedAmount INTEGER NOT NULL DEFAULT 0, product_name TEXT, product_price INTEGER,
      category_name TEXT, PRIMARY KEY (order_id, product_id)
    );
  `);
  await migrateCashDays(db);
  await db.exec(`
    INSERT INTO settings VALUES ('currency', 'EUR');
    INSERT INTO categories (id, name) VALUES (1, 'Buvette');
    INSERT INTO products (id, name, price, category_id) VALUES (1, 'Bière', 350, 1);
    INSERT INTO cash_days (id, opened_at, closed_at, closed_total, closed_cash_amount,
      closed_card_amount, closed_order_count) VALUES (1, 10, 20, 700, 700, 0, 1);
    INSERT INTO cash_days (id, opened_at) VALUES (2, 30);
    INSERT INTO orders (id, date, cash_amount, card_amount, cash_day_id)
      VALUES (1, 15, 700, NULL, 1), (2, 35, NULL, 350, 2);
    INSERT INTO order_items VALUES
      (1, 1, 2, 0, 'Bière', 350, 'Buvette'), (2, 1, 1, 0, 'Bière', 350, 'Buvette');
  `);
  return db;
}

const snapshot = async (db: Database) => ({
  settings: await db.all('SELECT * FROM settings'),
  products: await db.all('SELECT * FROM products'),
  cashDays: await db.all(
    `SELECT id, opened_at, closed_at, closed_total, closed_cash_amount, closed_card_amount,
       closed_order_count
     FROM cash_days ORDER BY id`
  ),
  orders: await db.all(
    'SELECT id, date, cash_amount, card_amount, cash_day_id FROM orders ORDER BY id'
  ),
  items: await db.all('SELECT * FROM order_items ORDER BY order_id'),
});

describe('accounts migration (3.0.0, D-063)', () => {
  let db: Database;

  beforeEach(async () => {
    db = await create240Db();
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds the tables, the roles and the author columns without touching the data', async () => {
    const before = await snapshot(db);

    expect(await migrateAuth(db)).toEqual({
      tablesCreated: true,
      columnsAdded: ['orders.created_by', 'cash_days.opened_by', 'cash_days.closed_by'],
    });

    expect(await snapshot(db)).toEqual(before);
    expect(await db.all('SELECT created_by FROM orders')).toEqual([
      { created_by: null },
      { created_by: null },
    ]);
    expect(await db.all('SELECT opened_by, closed_by FROM cash_days')).toEqual([
      { opened_by: null, closed_by: null },
      { opened_by: null, closed_by: null },
    ]);
    expect(await db.get('SELECT COUNT(*) AS n FROM users')).toEqual({ n: 0 });
  });

  it('seeds the roles: everything of today for the three, accounts for admin only', async () => {
    await migrateAuth(db);
    const rows = await db.all<{ role: string; permission: string }[]>(
      'SELECT role, permission FROM role_permissions ORDER BY role, permission'
    );
    const byRole = (role: string) => rows.filter((r) => r.role === role).map((r) => r.permission);
    expect(byRole('admin')).toEqual([...ROLE_PERMISSIONS.admin].sort());
    expect(byRole('manager')).toEqual(['cash_day', 'catalog', 'order_delete', 'sale']);
    expect(byRole('cashier')).toEqual(['cash_day', 'catalog', 'order_delete', 'sale']);
  });

  it('can run again: nothing changes, no error', async () => {
    await migrateAuth(db);
    const before = await snapshot(db);
    const roles = await db.all('SELECT * FROM role_permissions ORDER BY role, permission');

    expect(await migrateAuth(db)).toEqual({ tablesCreated: false, columnsAdded: [] });

    expect(await snapshot(db)).toEqual(before);
    expect(await db.all('SELECT * FROM role_permissions ORDER BY role, permission')).toEqual(roles);
  });

  it('keeps usernames unique without case', async () => {
    await migrateAuth(db);
    const insert = (name: string) =>
      db.run(
        `INSERT INTO users (username, password_hash, role, created_at, updated_at)
         VALUES (?, 'x', 'cashier', 0, 0)`,
        [name]
      );
    await insert('Marie');
    await expect(insert('marie')).rejects.toThrow('UNIQUE constraint failed');
  });
});
