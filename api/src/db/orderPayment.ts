import type { Database } from 'sqlite';

/** Payment columns of the orders table (D-034), in the smallest unit of the currency. */
export const ORDER_PAYMENT_COLUMNS = ['cash_amount', 'card_amount'] as const;

export async function getMissingOrderPaymentColumns(db: Database): Promise<string[]> {
  const columns = await db.all<{ name: string }[]>('PRAGMA table_info(orders)');
  const names = new Set(columns.map((column) => column.name));
  return ORDER_PAYMENT_COLUMNS.filter((column) => !names.has(column));
}

/**
 * Migration: adds orders.cash_amount and orders.card_amount (INTEGER, nullable).
 * Idempotent: only missing columns are added, in one transaction. Existing orders keep NULL
 * in both columns, which means "no payment recorded". Returns the columns added.
 */
export async function addOrderPaymentColumns(db: Database): Promise<string[]> {
  const missing = await getMissingOrderPaymentColumns(db);
  if (missing.length === 0) return [];

  await db.exec('BEGIN TRANSACTION');
  try {
    for (const column of missing) {
      // SQLite cannot bind identifiers as parameters, so the column name is interpolated.
      // Safe: `column` only comes from the ORDER_PAYMENT_COLUMNS constant above (filtered by
      // getMissingOrderPaymentColumns), never from user input.
      await db.exec(`ALTER TABLE orders ADD COLUMN ${column} INTEGER`);
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
  return missing;
}
