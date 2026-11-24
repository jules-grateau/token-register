import type { Database } from 'sqlite';

/**
 * Cash days (D-061): a day is opened, then closed. Every order belongs to the day open when it
 * was placed (orders.cash_day_id). The totals announced at the close are frozen in the closed_*
 * columns (smallest unit of the currency); the live totals are always computed from the orders.
 */
export const CASH_DAYS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS cash_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opened_at INTEGER NOT NULL,
    closed_at INTEGER,
    closed_total INTEGER,
    closed_cash_amount INTEGER,
    closed_card_amount INTEGER,
    closed_order_count INTEGER
  )
`;

/**
 * At most one open day, enforced by the database: two quick taps on "Démarrer la journée" cannot
 * open two days. Every open row has the same indexed value (1), so a second one is refused.
 */
export const CASH_DAYS_SINGLE_OPEN_INDEX_SQL = `
  CREATE UNIQUE INDEX IF NOT EXISTS cash_days_single_open
  ON cash_days ((closed_at IS NULL)) WHERE closed_at IS NULL
`;

export const ORDERS_CASH_DAY_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS orders_cash_day_id ON orders (cash_day_id)
`;

/** Creates the cash_days table and its index if missing (new and existing databases). */
export async function ensureCashDaysTable(db: Database): Promise<void> {
  await db.exec(CASH_DAYS_TABLE_SQL);
  await db.exec(CASH_DAYS_SINGLE_OPEN_INDEX_SQL);
}

/** Id of the open cash day, or null when none is open. */
export async function getOpenCashDayId(db: Database): Promise<number | null> {
  const row = await db.get<{ id: number }>('SELECT id FROM cash_days WHERE closed_at IS NULL');
  return row?.id ?? null;
}

/** Rolls back without hiding the original error (BEGIN may itself have failed). */
export async function rollbackQuietly(db: Database): Promise<void> {
  try {
    await db.exec('ROLLBACK');
  } catch {
    // No transaction was active: nothing to undo.
  }
}

export async function hasOrderCashDayColumn(db: Database): Promise<boolean> {
  const columns = await db.all<{ name: string }[]>('PRAGMA table_info(orders)');
  return columns.some((column) => column.name === 'cash_day_id');
}

export type CashDaysMigrationResult = {
  /** True when orders.cash_day_id was added by this run. */
  columnAdded: boolean;
  /** Orders deleted because they predate the cash days (D-061, answer 18 b). */
  deletedOrders: number;
};

/**
 * Migration (2.4.0, D-061): creates cash_days, adds orders.cash_day_id, and deletes the orders
 * placed before the cash days with their lines (answer 18 b: "Les commandes existantes sont
 * supprimées automatiquement à la migration"). The deletion only happens in the run that adds
 * the column, in the same transaction: later runs change nothing (idempotent), and a database
 * created by initDb.ts already has the column, so nothing is deleted there.
 */
export async function migrateCashDays(db: Database): Promise<CashDaysMigrationResult> {
  await db.exec('BEGIN TRANSACTION');
  try {
    await ensureCashDaysTable(db);
    let columnAdded = false;
    let deletedOrders = 0;
    if (!(await hasOrderCashDayColumn(db))) {
      await db.exec('ALTER TABLE orders ADD COLUMN cash_day_id INTEGER REFERENCES cash_days (id)');
      await db.exec('DELETE FROM order_items');
      const deleted = await db.run('DELETE FROM orders');
      deletedOrders = deleted.changes ?? 0;
      columnAdded = true;
    }
    await db.exec(ORDERS_CASH_DAY_INDEX_SQL);
    await db.exec('COMMIT');
    return { columnAdded, deletedOrders };
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}
