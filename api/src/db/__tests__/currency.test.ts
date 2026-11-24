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
import { addOrderPaymentColumns, getMissingOrderPaymentColumns } from '../orderPayment';
import { ensureCashDaysTable } from '../cashDays';

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

describe('order payment columns (D-034)', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createDb();
    await seedTokenData(db);
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds both columns once, keeping existing orders without payment', async () => {
    expect(await getMissingOrderPaymentColumns(db)).toEqual(['cash_amount', 'card_amount']);
    expect(await addOrderPaymentColumns(db)).toEqual(['cash_amount', 'card_amount']);
    expect(await addOrderPaymentColumns(db)).toEqual([]);

    const order = await db.get('SELECT cash_amount, card_amount FROM orders WHERE id = 1');
    expect(order).toEqual({ cash_amount: null, card_amount: null });
  });

  it('adds only the missing column', async () => {
    await db.exec('ALTER TABLE orders ADD COLUMN cash_amount INTEGER');
    expect(await addOrderPaymentColumns(db)).toEqual(['card_amount']);
  });
});

describe('currency conversion of recorded payments', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createDb();
    await seedTokenData(db);
    await addOrderPaymentColumns(db);
    await initInstanceCurrency(db, 'TOKEN');
  });

  afterEach(async () => {
    await db.close();
  });

  it('converts recorded payments 1 for 1 to euros', async () => {
    await db.exec('UPDATE orders SET cash_amount = 3, card_amount = 1 WHERE id = 1');

    await applyCurrencyConversion(db, await planCurrencyConversion(db, 'EUR'));

    const order = await db.get('SELECT cash_amount, card_amount FROM orders WHERE id = 1');
    expect(order).toEqual({ cash_amount: 300, card_amount: 100 });
  });

  it('leaves orders without payment untouched', async () => {
    const plan = await planCurrencyConversion(db, 'EUR');
    expect(plan.orderPayments).toEqual([]);
    await applyCurrencyConversion(db, plan);

    const order = await db.get('SELECT cash_amount, card_amount FROM orders WHERE id = 1');
    expect(order).toEqual({ cash_amount: null, card_amount: null });
  });

  it('warns in the preview that the split will be cleared, without writing (D-036)', async () => {
    await setStoredCurrency(db, 'EUR');
    await db.exec('UPDATE order_items SET product_price = 250, discountedAmount = 0');
    await db.exec('UPDATE orders SET cash_amount = 150, card_amount = 250 WHERE id = 1');

    const plan = await planCurrencyConversion(db, 'TOKEN');

    expect(plan.paymentsCleared).toBe(true);
    expect(plan.orderPayments).toEqual([
      { orderId: 1, cashBefore: 150, cashAfter: null, cardBefore: 250, cardAfter: null },
    ]);
    expect(describeConversionPlan(plan).join(' ')).toContain(
      '1 commandes : la répartition espèces / carte sera effacée'
    );
    const order = await db.get('SELECT cash_amount, card_amount FROM orders WHERE id = 1');
    expect(order).toEqual({ cash_amount: 150, card_amount: 250 });
  });

  it('clears the split and converts the totals when applied (D-036)', async () => {
    await setStoredCurrency(db, 'EUR');
    await db.exec('UPDATE order_items SET product_price = 250, discountedAmount = 0');
    await db.exec('UPDATE orders SET cash_amount = 150, card_amount = 250 WHERE id = 1');

    await applyCurrencyConversion(db, await planCurrencyConversion(db, 'TOKEN'));

    const order = await db.get('SELECT cash_amount, card_amount FROM orders WHERE id = 1');
    expect(order).toEqual({ cash_amount: null, card_amount: null });
    const items = await db.all<{ product_price: number }[]>(
      'SELECT product_price FROM order_items'
    );
    expect(items.map((item) => item.product_price)).toEqual([3, 3]); // 2,50 EUR -> 3 tokens
    expect(await getStoredCurrency(db)).toBe('TOKEN');
  });

  describe('announced totals of closed cash days (D-061)', () => {
    beforeEach(async () => {
      await ensureCashDaysTable(db);
      await db.exec(`
        INSERT INTO cash_days
          (id, opened_at, closed_at, closed_total, closed_cash_amount, closed_card_amount, closed_order_count)
        VALUES (1, 1, 2, 400, 150, 250, 1);
        INSERT INTO cash_days (id, opened_at) VALUES (2, 3);
      `);
      await setStoredCurrency(db, 'EUR');
    });

    it('converts the total and clears the split when converting to tokens', async () => {
      const plan = await planCurrencyConversion(db, 'TOKEN');
      expect(plan.cashDays).toEqual([
        {
          id: 1,
          totalBefore: 400,
          totalAfter: 4,
          cashBefore: 150,
          cashAfter: null,
          cardBefore: 250,
          cardAfter: null,
        },
      ]);
      expect(describeConversionPlan(plan).join(' ')).toContain(
        'Closed cash days: 1, announced totals converted, cash / card split cleared.'
      );

      await applyCurrencyConversion(db, plan);
      expect(
        await db.get(
          'SELECT closed_total, closed_cash_amount, closed_card_amount FROM cash_days WHERE id = 1'
        )
      ).toEqual({ closed_total: 4, closed_cash_amount: null, closed_card_amount: null });
    });

    it('ignores a database without cash days (before the migration)', async () => {
      await db.exec('DROP TABLE cash_days');
      expect((await planCurrencyConversion(db, 'TOKEN')).cashDays).toEqual([]);
    });
  });

  describe('order lines without a recorded price (D-056)', () => {
    beforeEach(async () => {
      await db.exec(`
        INSERT INTO orders (id, date) VALUES (2, 2000);
        INSERT INTO order_items
          (order_id, product_id, quantity, discountedAmount, product_name, product_price, category_name)
        VALUES (2, 1, 4, 0, 'Bière', NULL, 'Boissons');
      `);
    });

    it('keeps the price empty in the plan and leaves the line out of the revenue', async () => {
      const plan = await planCurrencyConversion(db, 'EUR');

      expect(plan.itemsWithoutPrice).toHaveLength(1);
      expect(plan.itemsWithoutPrice[0]).toMatchObject({
        orderId: 2,
        priceBefore: null,
        priceAfter: null,
      });
      // Same revenue as without the line: 2 x 3 - 1 + 1 x -1 = 4 tokens.
      expect(plan.revenueBefore).toBe(4);
      expect(plan.revenueAfter).toBe(400);
      expect(plan.inconsistentOrderItems).toEqual([]);
    });

    it('warns in the preview with the confirmed wording', async () => {
      const lines = describeConversionPlan(await planCurrencyConversion(db, 'EUR'));

      expect(lines).toContain(
        'Warning: 1 ligne(s) de commande sans prix enregistré (commandes #2) : ' +
          'prix inconnu, laissé vide'
      );
      expect(lines.join('\n')).toContain('not counted in the revenue');
    });

    it('lists at most 20 orders, then an ellipsis', async () => {
      for (let id = 3; id <= 23; id++) {
        await db.run('INSERT INTO orders (id, date) VALUES (?, 3000)', [id]);
        await db.run(
          `INSERT INTO order_items (order_id, product_id, quantity, product_name, product_price)
           VALUES (?, 1, 1, 'Bière', NULL)`,
          [id]
        );
      }

      const warning = describeConversionPlan(await planCurrencyConversion(db, 'EUR')).find((line) =>
        line.startsWith('Warning: 22 ligne(s)')
      );

      expect(warning).toContain('#21, …)');
      expect(warning).not.toContain('#22');
    });

    it('leaves the price empty when applying, and converts the rest of the line', async () => {
      await db.exec('UPDATE order_items SET discountedAmount = 1 WHERE order_id = 2');

      await applyCurrencyConversion(db, await planCurrencyConversion(db, 'EUR'));

      const line = await db.get<{ product_price: number | null; discountedAmount: number }>(
        'SELECT product_price, discountedAmount FROM order_items WHERE order_id = 2'
      );
      expect(line).toEqual({ product_price: null, discountedAmount: 100 });
      expect(await getStoredCurrency(db)).toBe('EUR');
    });

    it('gives no missing-price warning when every line has a price', async () => {
      await db.exec('UPDATE order_items SET product_price = 3 WHERE order_id = 2');

      const plan = await planCurrencyConversion(db, 'EUR');

      expect(plan.itemsWithoutPrice).toEqual([]);
      expect(describeConversionPlan(plan).join('\n')).not.toContain('sans prix');
    });
  });

  it('gives no warning when no payment is recorded', async () => {
    await setStoredCurrency(db, 'EUR');
    const plan = await planCurrencyConversion(db, 'TOKEN');
    expect(plan.paymentsCleared).toBe(false);
    expect(describeConversionPlan(plan).join(' ')).not.toContain('D-036');
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
