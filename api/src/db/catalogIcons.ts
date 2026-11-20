import type { Database } from 'sqlite';

/** Tables that get an optional `icon` column (D-046 products, D-047 categories). */
export const CATALOG_ICON_TABLES = ['products', 'categories'] as const;

export async function getTablesMissingIconColumn(db: Database): Promise<string[]> {
  const missing: string[] = [];
  for (const table of CATALOG_ICON_TABLES) {
    const columns = await db.all<{ name: string }[]>(`PRAGMA table_info(${table})`);
    if (!columns.some((column) => column.name === 'icon')) missing.push(table);
  }
  return missing;
}

/**
 * Migration: adds products.icon and categories.icon (TEXT, nullable: key of a catalog icon).
 * Idempotent: only missing columns are added, in one transaction. Existing rows keep NULL,
 * which means "no icon" (D-046: the product shows its initial, D-047: the tab shows its name).
 * Returns the tables that got the column.
 */
export async function addCatalogIconColumns(db: Database): Promise<string[]> {
  const missing = await getTablesMissingIconColumn(db);
  if (missing.length === 0) return [];

  await db.exec('BEGIN TRANSACTION');
  try {
    for (const table of missing) {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN icon TEXT`);
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
  return missing;
}
