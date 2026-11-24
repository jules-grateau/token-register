import type { Database } from 'sqlite';
import type { CurrencyCode } from 'shared-ts';
import { convertAmount, isCurrencyCode } from '../utils/currency';
import { getMissingOrderPaymentColumns } from './orderPayment';

const CURRENCY_KEY = 'currency';

export const CONVERT_COMMAND = 'npm run prod:db:convert-currency -- --to=<TOKEN|EUR>';

export class CurrencyMismatchError extends Error {
  constructor(
    public readonly stored: CurrencyCode,
    public readonly configured: CurrencyCode
  ) {
    super(
      `Currency mismatch: this database is in ${stored} but CURRENCY=${configured}. ` +
        `The application refuses to start so that amounts are never misread. ` +
        `If CURRENCY is wrong, set it back to ${stored}. ` +
        `If the instance really has to switch to ${configured}, back up the database and run ` +
        `"${CONVERT_COMMAND.replace('<TOKEN|EUR>', configured)}" (preview), ` +
        `then again with --apply (see deploy/README.md).`
    );
    this.name = 'CurrencyMismatchError';
  }
}

export async function ensureSettingsTable(db: Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

async function settingsTableExists(db: Database): Promise<boolean> {
  const row = await db.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'settings'"
  );
  return !!row;
}

/** Currency recorded in the database, or null if none has been recorded yet. */
export async function getStoredCurrency(db: Database): Promise<CurrencyCode | null> {
  if (!(await settingsTableExists(db))) return null;
  const row = await db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    CURRENCY_KEY,
  ]);
  if (!row) return null;
  if (!isCurrencyCode(row.value)) {
    throw new Error(`Invalid currency "${row.value}" stored in the settings table.`);
  }
  return row.value;
}

export async function setStoredCurrency(db: Database, currency: CurrencyCode): Promise<void> {
  await db.run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [CURRENCY_KEY, currency]
  );
}

async function hasExistingData(db: Database): Promise<boolean> {
  const products = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM products');
  const orders = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM orders');
  return (products?.count ?? 0) > 0 || (orders?.count ?? 0) > 0;
}

/**
 * Records the instance currency the first time (D-009), then checks it on every start.
 * A database that already holds data but has no recorded currency predates the currency
 * feature: its amounts are tokens, whatever CURRENCY says.
 * Throws CurrencyMismatchError when the configuration disagrees with the database.
 */
export async function initInstanceCurrency(
  db: Database,
  configured: CurrencyCode
): Promise<{ currency: CurrencyCode; recorded: boolean }> {
  await ensureSettingsTable(db);
  let stored = await getStoredCurrency(db);
  let recorded = false;

  if (!stored) {
    stored = (await hasExistingData(db)) ? 'TOKEN' : configured;
    await setStoredCurrency(db, stored);
    recorded = true;
  }

  if (stored !== configured) {
    throw new CurrencyMismatchError(stored, configured);
  }
  return { currency: stored, recorded };
}

/** Read-only check used by the API server at startup. */
export async function verifyInstanceCurrency(
  db: Database,
  configured: CurrencyCode
): Promise<void> {
  const stored = await getStoredCurrency(db);
  if (!stored) {
    throw new Error(
      'No currency recorded in the database. Run the database migration first (db:migrate).'
    );
  }
  if (stored !== configured) {
    throw new CurrencyMismatchError(stored, configured);
  }
}

export type ProductConversion = {
  id: number;
  name: string;
  before: number;
  after: number;
};

export type OrderItemConversion = {
  rowid: number;
  orderId: number;
  productName: string;
  quantity: number;
  /** null: no price recorded for this line, left empty by the conversion (D-056). */
  priceBefore: number | null;
  priceAfter: number | null;
  discountBefore: number;
  discountAfter: number;
};

/** An order line with a recorded price (D-056). */
export type PricedOrderItemConversion = OrderItemConversion & {
  priceBefore: number;
  priceAfter: number;
};

export type OrderPaymentConversion = {
  orderId: number;
  cashBefore: number | null;
  cashAfter: number | null;
  cardBefore: number | null;
  cardAfter: number | null;
};

/** Totals announced at the close of a cash day (D-061), frozen in cash_days. */
export type CashDayConversion = {
  id: number;
  totalBefore: number;
  totalAfter: number;
  cashBefore: number | null;
  cashAfter: number | null;
  cardBefore: number | null;
  cardAfter: number | null;
};

export type CurrencyConversionPlan = {
  from: CurrencyCode;
  to: CurrencyCode;
  products: ProductConversion[];
  orderItems: OrderItemConversion[];
  /** Lines where the rounded discount would exceed the rounded line total. */
  inconsistentOrderItems: PricedOrderItemConversion[];
  /** D-056: lines with no recorded price, kept empty and left out of the revenue. */
  itemsWithoutPrice: OrderItemConversion[];
  /** Orders with a recorded payment (cash / card amounts, D-034). */
  orderPayments: OrderPaymentConversion[];
  /**
   * D-036: token instances record no payment (D-033), so a conversion to TOKEN clears the
   * cash / card split of these orders (their totals are converted as usual, D-009).
   */
  paymentsCleared: boolean;
  /**
   * Closed cash days (D-061): their announced totals are converted like the history; to TOKEN,
   * their cash / card split is cleared, like the orders' (D-036).
   */
  cashDays: CashDayConversion[];
  revenueBefore: number;
  revenueAfter: number;
};

const lineTotal = (price: number, quantity: number, discount: number) =>
  price * quantity - discount;

/** Computes every converted amount without writing anything (preview mode). */
export async function planCurrencyConversion(
  db: Database,
  to: CurrencyCode
): Promise<CurrencyConversionPlan> {
  const from = await getStoredCurrency(db);
  if (!from) {
    throw new Error(
      'No currency recorded in the database. Run the database migration first (db:migrate).'
    );
  }

  const productRows = await db.all<{ id: number; name: string; price: number }[]>(
    'SELECT id, name, price FROM products ORDER BY id'
  );
  const products = productRows.map((row) => ({
    id: row.id,
    name: row.name,
    before: row.price,
    after: convertAmount(row.price, from, to),
  }));

  const itemRows = await db.all<
    {
      rowid: number;
      order_id: number;
      product_name: string | null;
      quantity: number;
      product_price: number | null;
      discountedAmount: number;
    }[]
  >(
    `SELECT rowid, order_id, product_name, quantity, product_price, discountedAmount
     FROM order_items ORDER BY order_id, rowid`
  );
  const orderItems = itemRows.map((row) => {
    const priceBefore = row.product_price;
    return {
      rowid: row.rowid,
      orderId: row.order_id,
      productName: row.product_name ?? '',
      quantity: row.quantity,
      priceBefore,
      priceAfter: priceBefore === null ? null : convertAmount(priceBefore, from, to),
      discountBefore: row.discountedAmount,
      discountAfter: convertAmount(row.discountedAmount, from, to),
    };
  });

  // D-056: a line without a recorded price is left empty and out of the revenue.
  const itemsWithoutPrice = orderItems.filter((item) => item.priceBefore === null);
  const pricedItems = orderItems.filter(
    (item): item is PricedOrderItemConversion =>
      item.priceBefore !== null && item.priceAfter !== null
  );

  const inconsistentOrderItems = pricedItems.filter(
    (item) => item.discountAfter > Math.max(0, item.priceAfter * item.quantity)
  );

  const revenueBefore = pricedItems.reduce(
    (sum, item) => sum + lineTotal(item.priceBefore, item.quantity, item.discountBefore),
    0
  );
  const revenueAfter = pricedItems.reduce(
    (sum, item) => sum + lineTotal(item.priceAfter, item.quantity, item.discountAfter),
    0
  );

  const orderPayments = await planOrderPaymentConversion(db, from, to);
  const paymentsCleared = to === 'TOKEN' && from !== to && orderPayments.length > 0;
  const cashDays = await planCashDayConversion(db, from, to);

  return {
    from,
    to,
    products,
    orderItems,
    inconsistentOrderItems,
    itemsWithoutPrice,
    orderPayments,
    paymentsCleared,
    cashDays,
    revenueBefore,
    revenueAfter,
  };
}

async function planOrderPaymentConversion(
  db: Database,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<OrderPaymentConversion[]> {
  // Run before the payment migration: no column, nothing to convert.
  if ((await getMissingOrderPaymentColumns(db)).length > 0) return [];

  const rows = await db.all<
    { id: number; cash_amount: number | null; card_amount: number | null }[]
  >(
    `SELECT id, cash_amount, card_amount FROM orders
     WHERE cash_amount IS NOT NULL OR card_amount IS NOT NULL ORDER BY id`
  );
  // D-036: to tokens, the split is cleared; to euros, amounts are converted 1 for 1 (D-009).
  const convert = (amount: number | null) =>
    amount === null || to === 'TOKEN' ? null : convertAmount(amount, from, to);
  return rows.map((row) => ({
    orderId: row.id,
    cashBefore: row.cash_amount,
    cashAfter: convert(row.cash_amount),
    cardBefore: row.card_amount,
    cardAfter: convert(row.card_amount),
  }));
}

async function planCashDayConversion(
  db: Database,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<CashDayConversion[]> {
  // Run before the cash days migration: no table, nothing to convert.
  const table = await db.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'cash_days'"
  );
  if (!table) return [];

  const rows = await db.all<
    {
      id: number;
      closed_total: number | null;
      closed_cash_amount: number | null;
      closed_card_amount: number | null;
    }[]
  >(
    `SELECT id, closed_total, closed_cash_amount, closed_card_amount FROM cash_days
     WHERE closed_at IS NOT NULL ORDER BY id`
  );
  const convertSplit = (amount: number | null) =>
    amount === null || to === 'TOKEN' ? null : convertAmount(amount, from, to);
  return rows.map((row) => {
    const totalBefore = row.closed_total ?? 0;
    return {
      id: row.id,
      totalBefore,
      totalAfter: convertAmount(totalBefore, from, to),
      cashBefore: row.closed_cash_amount,
      cashAfter: convertSplit(row.closed_cash_amount),
      cardBefore: row.closed_card_amount,
      cardAfter: convertSplit(row.closed_card_amount),
    };
  });
}

/**
 * Applies a conversion plan in a single transaction and records the new currency.
 * D-016: if any order line would end up with a discount larger than its total after rounding,
 * the whole conversion is refused and nothing is written. The admin must handle those orders
 * first (the preview lists them).
 */
export async function applyCurrencyConversion(
  db: Database,
  plan: CurrencyConversionPlan
): Promise<void> {
  if (plan.inconsistentOrderItems.length > 0) {
    throw new Error(
      `${plan.inconsistentOrderItems.length} order line(s) would end up with a discount larger ` +
        'than their total after rounding. Nothing was converted (D-016). ' +
        'Handle the orders listed in the preview first, then run the ' +
        'conversion again.'
    );
  }

  await db.exec('BEGIN TRANSACTION');
  try {
    for (const payment of plan.orderPayments) {
      await db.run('UPDATE orders SET cash_amount = ?, card_amount = ? WHERE id = ?', [
        payment.cashAfter,
        payment.cardAfter,
        payment.orderId,
      ]);
    }
    for (const day of plan.cashDays) {
      await db.run(
        `UPDATE cash_days SET closed_total = ?, closed_cash_amount = ?, closed_card_amount = ?
         WHERE id = ?`,
        [day.totalAfter, day.cashAfter, day.cardAfter, day.id]
      );
    }
    for (const product of plan.products) {
      await db.run('UPDATE products SET price = ? WHERE id = ?', [product.after, product.id]);
    }
    for (const item of plan.orderItems) {
      await db.run(
        'UPDATE order_items SET product_price = ?, discountedAmount = ? WHERE rowid = ?',
        [item.priceAfter, item.discountAfter, item.rowid]
      );
    }
    await setStoredCurrency(db, plan.to);
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

export type ConvertCurrencyArgs = { to: CurrencyCode; apply: boolean };

/** Parses `--to=EUR` / `--to EUR` and `--apply`. Throws a usage message on bad input. */
export function parseConvertCurrencyArgs(argv: string[]): ConvertCurrencyArgs {
  let to: string | undefined;
  let apply = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--apply') apply = true;
    else if (arg.startsWith('--to=')) to = arg.slice('--to='.length);
    else if (arg === '--to') to = argv[++i];
    else throw new Error(`Unknown argument "${arg}". Usage: ${CONVERT_COMMAND} [--apply]`);
  }
  const target = to?.trim().toUpperCase();
  if (!isCurrencyCode(target)) {
    throw new Error(`Missing or invalid --to. Usage: ${CONVERT_COMMAND} [--apply]`);
  }
  return { to: target, apply };
}

/** Plain, locale-independent rendering for the command output: "3 TOKEN", "1.50 EUR". */
export function formatStoredAmount(amount: number, currency: CurrencyCode): string {
  return currency === 'EUR' ? `${(amount / 100).toFixed(2)} EUR` : `${amount} TOKEN`;
}

/** D-056: at most this many order numbers are listed in the missing-price warning. */
const MAX_LISTED_ORDERS = 20;

export function describeConversionPlan(plan: CurrencyConversionPlan): string[] {
  const fmtFrom = (n: number) => formatStoredAmount(n, plan.from);
  const fmtTo = (n: number) => formatStoredAmount(n, plan.to);
  const lines = [`Conversion ${plan.from} -> ${plan.to} (1 for 1)`, '', 'Products:'];
  if (plan.products.length === 0) lines.push('  (none)');
  for (const p of plan.products) {
    lines.push(`  #${p.id} ${p.name}: ${fmtFrom(p.before)} -> ${fmtTo(p.after)}`);
  }
  lines.push(
    '',
    `Order history: ${plan.orderItems.length} order line(s) converted.`,
    `  Total revenue: ${fmtFrom(plan.revenueBefore)} -> ${fmtTo(plan.revenueAfter)}`
  );
  if (plan.itemsWithoutPrice.length > 0) {
    lines.push('  (lines without a recorded price are not counted in the revenue)');
  }
  if (plan.orderPayments.length > 0) {
    lines.push(`  Recorded payments: ${plan.orderPayments.length} order(s).`);
  }
  if (plan.cashDays.length > 0) {
    lines.push(
      `  Closed cash days: ${plan.cashDays.length}, announced totals converted` +
        (plan.to === 'TOKEN' && plan.from !== plan.to ? ', cash / card split cleared.' : '.')
    );
  }
  if (plan.paymentsCleared) {
    // Wording confirmed by the product owner (D-036).
    lines.push(
      '',
      `Warning (D-036): ${plan.orderPayments.length} commandes : la répartition espèces / carte ` +
        'sera effacée (token instances record no payment).'
    );
  }
  if (plan.itemsWithoutPrice.length > 0) {
    const orderIds = [...new Set(plan.itemsWithoutPrice.map((item) => item.orderId))];
    const listed = orderIds.slice(0, MAX_LISTED_ORDERS).map((id) => `#${id}`);
    if (orderIds.length > MAX_LISTED_ORDERS) listed.push('…');
    // Wording confirmed by the product owner (D-056).
    lines.push(
      '',
      `Warning: ${plan.itemsWithoutPrice.length} ligne(s) de commande sans prix enregistré ` +
        `(commandes ${listed.join(', ')}) : prix inconnu, laissé vide`
    );
  }
  if (plan.inconsistentOrderItems.length > 0) {
    lines.push(
      '',
      'Blocking (D-016): these order lines would get a discount larger than their total ' +
        'after rounding. The conversion will be refused until these orders are handled:'
    );
    for (const item of plan.inconsistentOrderItems) {
      lines.push(
        `  order #${item.orderId} ${item.productName} x${item.quantity}: ` +
          `price ${fmtFrom(item.priceBefore)} -> ${fmtTo(item.priceAfter)}, ` +
          `discount ${fmtFrom(item.discountBefore)} -> ${fmtTo(item.discountAfter)}`
      );
    }
  }
  return lines;
}
