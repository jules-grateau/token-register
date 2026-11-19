import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import {
  CurrencyMismatchError,
  applyCurrencyConversion,
  describeConversionPlan,
  getStoredCurrency,
  initInstanceCurrency,
  parseConvertCurrencyArgs,
  planCurrencyConversion,
  setStoredCurrency,
  verifyInstanceCurrency,
} from '../currency';

async function createDb(): Promise<Database> {
  const db = await open({ filename: ':memory:', driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      price INTEGER NOT NULL, category_id INTEGER NOT NULL
    );
    CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL);
    CREATE TABLE order_items (
      order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL,
      discountedAmount INTEGER NOT NULL DEFAULT 0, product_name TEXT, product_price INTEGER,
      category_name TEXT, PRIMARY KEY (order_id, product_id)
    );
  `);
  return db;
}

async function seedTokenData(db: Database): Promise<void> {
  await db.exec(`
    INSERT INTO categories (id, name) VALUES (1, 'Boissons');
    INSERT INTO products (id, name, price, category_id) VALUES
      (1, 'Bière', 3, 1), (2, 'Retour Eco-cup', -1, 1);
    INSERT INTO orders (id, date) VALUES (1, 1000);
    INSERT INTO order_items
      (order_id, product_id, quantity, discountedAmount, product_name, product_price, category_name)
    VALUES (1, 1, 2, 1, 'Bière', 3, 'Boissons'), (1, 2, 1, 0, 'Retour Eco-cup', -1, 'Boissons');
  `);
}

describe('instance currency', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createDb();
  });

  afterEach(async () => {
    await db.close();
  });

  it('records the configured currency on an empty database', async () => {
    await expect(initInstanceCurrency(db, 'EUR')).resolves.toEqual({
      currency: 'EUR',
      recorded: true,
    });
    expect(await getStoredCurrency(db)).toBe('EUR');
  });

  it('records TOKEN for a database that predates the currency feature', async () => {
    await seedTokenData(db);

    await initInstanceCurrency(db, 'TOKEN');

    expect(await getStoredCurrency(db)).toBe('TOKEN');
  });

  it('refuses an existing token database started with CURRENCY=EUR, without converting', async () => {
    await seedTokenData(db);

    await expect(initInstanceCurrency(db, 'EUR')).rejects.toThrow(CurrencyMismatchError);

    expect(await getStoredCurrency(db)).toBe('TOKEN');
    const beer = await db.get<{ price: number }>('SELECT price FROM products WHERE id = 1');
    expect(beer?.price).toBe(3);
  });

  it('is idempotent and checks the currency on every run', async () => {
    await initInstanceCurrency(db, 'EUR');
    await expect(initInstanceCurrency(db, 'EUR')).resolves.toEqual({
      currency: 'EUR',
      recorded: false,
    });
    await expect(initInstanceCurrency(db, 'TOKEN')).rejects.toThrow(
      /database is in EUR but CURRENCY=TOKEN.*convert-currency -- --to=TOKEN/
    );
  });

  it('verifyInstanceCurrency asks for the migration when nothing is recorded', async () => {
    await expect(verifyInstanceCurrency(db, 'TOKEN')).rejects.toThrow('db:migrate');
  });

  it('verifyInstanceCurrency passes on a match and fails on a mismatch', async () => {
    await initInstanceCurrency(db, 'TOKEN');
    await expect(verifyInstanceCurrency(db, 'TOKEN')).resolves.toBeUndefined();
    await expect(verifyInstanceCurrency(db, 'EUR')).rejects.toThrow(CurrencyMismatchError);
  });
});

describe('currency conversion command', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createDb();
    await seedTokenData(db);
    await initInstanceCurrency(db, 'TOKEN');
  });

  afterEach(async () => {
    await db.close();
  });

  it('previews the conversion without writing anything', async () => {
    const plan = await planCurrencyConversion(db, 'EUR');

    expect(plan.products).toEqual([
      { id: 1, name: 'Bière', before: 3, after: 300 },
      { id: 2, name: 'Retour Eco-cup', before: -1, after: -100 },
    ]);
    expect(plan.revenueBefore).toBe(4);
    expect(plan.revenueAfter).toBe(400);
    expect(describeConversionPlan(plan).join('\n')).toContain('#1 Bière: 3 TOKEN -> 3.00 EUR');

    expect(await getStoredCurrency(db)).toBe('TOKEN');
    const beer = await db.get<{ price: number }>('SELECT price FROM products WHERE id = 1');
    expect(beer?.price).toBe(3);
  });

  it('converts catalog and order history, then records the new currency', async () => {
    await applyCurrencyConversion(db, await planCurrencyConversion(db, 'EUR'));

    expect(await getStoredCurrency(db)).toBe('EUR');
    const products = await db.all<{ price: number }[]>('SELECT price FROM products ORDER BY id');
    expect(products.map((p) => p.price)).toEqual([300, -100]);
    const items = await db.all<{ product_price: number; discountedAmount: number }[]>(
      'SELECT product_price, discountedAmount FROM order_items ORDER BY product_id'
    );
    expect(items).toEqual([
      { product_price: 300, discountedAmount: 100 },
      { product_price: -100, discountedAmount: 0 },
    ]);
  });

  it('converts euros back to the nearest token, .5 away from zero', async () => {
    await db.exec(`
      UPDATE products SET price = 150 WHERE id = 1;
      UPDATE products SET price = -150 WHERE id = 2;
      UPDATE order_items SET product_price = 149, discountedAmount = 0 WHERE product_id = 1;
    `);
    await setStoredCurrency(db, 'EUR');

    await applyCurrencyConversion(db, await planCurrencyConversion(db, 'TOKEN'));

    const products = await db.all<{ price: number }[]>('SELECT price FROM products ORDER BY id');
    expect(products.map((p) => p.price)).toEqual([2, -2]);
    const beerLine = await db.get<{ product_price: number }>(
      'SELECT product_price FROM order_items WHERE product_id = 1'
    );
    expect(beerLine?.product_price).toBe(1);
    expect(await getStoredCurrency(db)).toBe('TOKEN');
  });

  it('refuses to write anything when rounding makes a discount exceed its line total', async () => {
    // 2 x 1,49 EUR with a 2,98 EUR discount -> 2 x 1 token with a 3 token discount.
    await db.exec(
      'UPDATE order_items SET product_price = 149, discountedAmount = 298 WHERE product_id = 1'
    );
    await setStoredCurrency(db, 'EUR');
    const plan = await planCurrencyConversion(db, 'TOKEN');

    expect(plan.inconsistentOrderItems).toHaveLength(1);
    expect(describeConversionPlan(plan).join('\n')).toContain('Blocking (D-016)');
    await expect(applyCurrencyConversion(db, plan)).rejects.toThrow('Nothing was converted');
    expect(await getStoredCurrency(db)).toBe('EUR');
  });

  it('rolls back everything if a write fails', async () => {
    const plan = await planCurrencyConversion(db, 'EUR');
    await db.exec('DROP TABLE order_items'); // makes the history update fail

    await expect(applyCurrencyConversion(db, plan)).rejects.toThrow();

    const beer = await db.get<{ price: number }>('SELECT price FROM products WHERE id = 1');
    expect(beer?.price).toBe(3);
    expect(await getStoredCurrency(db)).toBe('TOKEN');
  });
});

describe('parseConvertCurrencyArgs', () => {
  it('defaults to preview mode', () => {
    expect(parseConvertCurrencyArgs(['--to=EUR'])).toEqual({ to: 'EUR', apply: false });
    expect(parseConvertCurrencyArgs(['--to', 'token'])).toEqual({ to: 'TOKEN', apply: false });
  });

  it('applies only with an explicit flag', () => {
    expect(parseConvertCurrencyArgs(['--to=EUR', '--apply'])).toEqual({ to: 'EUR', apply: true });
  });

  it('rejects a missing or unknown target', () => {
    expect(() => parseConvertCurrencyArgs([])).toThrow('--to');
    expect(() => parseConvertCurrencyArgs(['--to=USD'])).toThrow('--to');
    expect(() => parseConvertCurrencyArgs(['--to=EUR', '--force'])).toThrow('Unknown argument');
  });
});
