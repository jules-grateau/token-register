import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { CashDayService, MAX_CLOSED_CASH_DAYS } from '../cashDay.service';
import { OrderService } from '../order.service';
import { ensureCashDaysTable } from '../../db/cashDays';
import { migrateAuth } from '../../db/auth';
import { createTempDbPath } from '../../db/scripts/__tests__/dbTestUtils';
import { ConflictError } from '../../types/errors';

// Real SQLite file: the sums, the unique index and the transactions are what is tested here.
const { dbPath, cleanup } = createTempDbPath('test-cash-days');
const previousPath = process.env.DATABASE_PATH;

async function resetDb() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  try {
    await db.exec(`
      DROP TABLE IF EXISTS order_items; DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS products; DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS cash_days; DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS role_permissions; DROP TABLE IF EXISTS roles;
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
      INSERT INTO categories (id, name) VALUES (1, 'Boissons');
      INSERT INTO products (id, name, price, category_id) VALUES
        (1, 'Bière', 350, 1), (2, 'Café', 150, 1), (3, 'Retour eco-cup', -100, 1);
    `);
    // D-063: author columns (orders.created_by, cash_days.opened_by / closed_by).
    await migrateAuth(db);
    await db.exec(
      "INSERT INTO users (id, username, password_hash, role, created_at, updated_at) VALUES (9, 'caisse', 'x', 'cashier', 0, 0)"
    );
  } finally {
    await db.close();
  }
}

const item = (id: number, price: number, quantity = 1, discountedAmount = 0) => ({
  product: { id, name: '', price, categoryId: 1 },
  quantity,
  discountedAmount,
});

beforeAll(() => {
  process.env.DATABASE_PATH = dbPath;
});

afterAll(() => {
  if (previousPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = previousPath;
  cleanup();
});

beforeEach(async () => {
  await resetDb();
});

describe('CashDayService (EUR)', () => {
  const days = new CashDayService('EUR');
  const orders = new OrderService('EUR');

  it('has no open day on a new database', async () => {
    expect(await days.getCurrent()).toBeNull();
    expect(await days.listClosed()).toEqual([]);
  });

  it('opens a day once: a second opening is refused', async () => {
    const day = await days.open();
    expect(day).toMatchObject({ closedAt: null, announced: null, modifiedAfterClose: false });
    expect(day.summary).toEqual({ total: 0, cashAmount: 0, cardAmount: 0, orderCount: 0 });

    await expect(days.open()).rejects.toMatchObject({ code: 'CASH_DAY_ALREADY_OPEN' });
    await expect(Promise.all([days.closeCurrent(), days.closeCurrent()])).rejects.toBeInstanceOf(
      ConflictError
    );
  });

  it('refuses two concurrent openings (two quick taps)', async () => {
    const results = await Promise.allSettled([days.open(), days.open(), days.open()]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  });

  it('sums the net total, cash, card and orders of the open day (answer 4 a)', async () => {
    await days.open();
    await orders.createOrder([item(1, 350, 2)], { cashAmount: 700, cardAmount: null });
    await orders.createOrder([item(2, 150)], { cashAmount: null, cardAmount: 150 });
    // Mixed: in both columns.
    await orders.createOrder([item(1, 350), item(2, 150, 1, 50)], {
      cashAmount: 200,
      cardAmount: 250,
    });
    // Negative total (deposit return), carried by the chosen mode (D-032).
    await orders.createOrder([item(3, -100)], { cashAmount: -100, cardAmount: null });

    const current = await days.getCurrent();
    expect(current?.summary).toEqual({
      total: 700 + 150 + 450 - 100,
      cashAmount: 700 + 200 - 100,
      cardAmount: 150 + 250,
      orderCount: 4,
    });
  });

  it('freezes the totals at the close, then flags a deletion (answers 6 a, 17 a)', async () => {
    const opened = await days.open();
    const { id: first } = await orders.createOrder([item(1, 350)], {
      cashAmount: 350,
      cardAmount: null,
    });
    await orders.createOrder([item(2, 150)], { cashAmount: null, cardAmount: 150 });

    const closed = await days.closeCurrent();
    expect(closed.closedAt).not.toBeNull();
    expect(closed.announced).toEqual({
      total: 500,
      cashAmount: 350,
      cardAmount: 150,
      orderCount: 2,
    });
    expect(closed.modifiedAfterClose).toBe(false);
    expect(await days.getCurrent()).toBeNull();
    await expect(days.closeCurrent()).rejects.toMatchObject({ code: 'NO_OPEN_CASH_DAY' });

    // No sale without an open day (answer 1 b).
    await expect(
      orders.createOrder([item(1, 350)], { cashAmount: 350, cardAmount: null })
    ).rejects.toMatchObject({ code: 'CASH_DAY_REQUIRED' });

    // Not from the history: from its day only.
    await expect(orders.deleteOrder(first)).rejects.toMatchObject({ code: 'CASH_DAY_CLOSED' });
    await orders.deleteOrder(first, { cashDayId: opened.id });

    const [day] = await days.listClosed();
    expect(day.announced?.total).toBe(500);
    expect(day.summary).toEqual({ total: 150, cashAmount: 0, cardAmount: 150, orderCount: 1 });
    expect(day.modifiedAfterClose).toBe(true);
  });

  it('lists only the open day in the history (answer 15 a)', async () => {
    const first = await days.open();
    await orders.createOrder([item(1, 350)], { cashAmount: 350, cardAmount: null });
    await days.closeCurrent();
    expect((await orders.getAllOrders()).data).toEqual([]);

    await days.open();
    await orders.createOrder([item(2, 150)], { cashAmount: 150, cardAmount: null });
    const history = await orders.getAllOrders();
    expect(history.data).toHaveLength(1);
    expect(history.data[0].items[0].productName).toBe('Café');

    const past = await orders.getAllOrders({ page: 1, pageSize: 20 }, { cashDayId: first.id });
    expect(past.data[0].items[0].productName).toBe('Bière');
  });

  it(`keeps the ${MAX_CLOSED_CASH_DAYS} most recent closed days`, async () => {
    for (let i = 0; i < MAX_CLOSED_CASH_DAYS + 2; i++) {
      await days.open();
      await days.closeCurrent();
    }
    const list = await days.listClosed();
    expect(list).toHaveLength(MAX_CLOSED_CASH_DAYS);
    expect(list[0].id).toBe(MAX_CLOSED_CASH_DAYS + 2);
  });
});

describe('Authors (D-063, point 14)', () => {
  it('records who placed each order, and who opened and closed the day', async () => {
    const days = new CashDayService('TOKEN');
    const orders = new OrderService('TOKEN');
    const { id: dayId } = await days.open(9);
    const { id: orderId } = await orders.createOrder([item(2, 150)], null, 9);
    await days.closeCurrent(9);

    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    try {
      expect(
        await db.get('SELECT opened_by, closed_by FROM cash_days WHERE id = ?', [dayId])
      ).toEqual({ opened_by: 9, closed_by: 9 });
      expect(await db.get('SELECT created_by FROM orders WHERE id = ?', [orderId])).toEqual({
        created_by: 9,
      });
    } finally {
      await db.close();
    }
  });
});

describe('CashDayService (TOKEN, answer 5 a)', () => {
  it('has a total and an order count, without cash / card split', async () => {
    const days = new CashDayService('TOKEN');
    await days.open();
    await new OrderService('TOKEN').createOrder([item(1, 350, 2)], null);
    const closed = await days.closeCurrent();
    expect(closed.summary).toEqual({
      total: 700,
      cashAmount: null,
      cardAmount: null,
      orderCount: 1,
    });
    expect(closed.announced).toEqual(closed.summary);
  });
});
