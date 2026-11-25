import fs from 'fs';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

/**
 * Temporary database path, in a directory unique to the calling test file.
 * A name based on Date.now() alone can collide between Jest workers that start
 * in the same millisecond (issue #40): another test would then flush or delete
 * this database.
 */
export function createTempDbPath(prefix: string): { dbPath: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  return {
    dbPath: path.join(dir, 'db.sqlite'),
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

/** Polls `condition` until it returns true; fails after `timeoutMs` (issue #32). */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  description: string,
  timeoutMs = 10000,
  intervalMs = 25
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await condition()) return;
    if (Date.now() > deadline)
      throw new Error(`Timed out after ${timeoutMs} ms waiting for ${description}`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/** Table names of the database, or an empty list if it cannot be read yet. */
export async function listTables(dbPath: string): Promise<string[]> {
  if (!fs.existsSync(dbPath)) return [];
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY,
    });
    try {
      const rows = await db.all<{ name: string }[]>(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      return rows.map((row) => row.name);
    } finally {
      await db.close();
    }
  } catch {
    // Database still being created by the script under test (locked or empty file).
    return [];
  }
}

/** Message logged by initDb once the database is closed. */
export const INIT_DONE_MESSAGES = ['Database initialization complete'];

export const APP_TABLES = ['categories', 'products', 'orders', 'order_items', 'cash_days'];

export async function hasAppTables(dbPath: string): Promise<boolean> {
  const tables = await listTables(dbPath);
  return APP_TABLES.every((table) => tables.includes(table));
}

/** True once `spy` was called with a first argument containing one of `messages`. */
export function wasLogged(spy: jest.SpyInstance, messages: string[]): boolean {
  return spy.mock.calls.some(
    ([first]) => typeof first === 'string' && messages.some((message) => first.includes(message))
  );
}

/** Number of rows of the catalog tables (D-055: a new database has none). */
export async function countCatalog(
  dbPath: string
): Promise<{ categories: number; products: number }> {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  try {
    const categories = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM categories');
    const products = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM products');
    return { categories: categories?.count ?? 0, products: products?.count ?? 0 };
  } finally {
    await db.close();
  }
}
