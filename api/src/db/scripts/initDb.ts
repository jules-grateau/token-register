import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import logger from '../../utils/logger';
import path from 'path';
import fs from 'fs';
import { getDatabasePath } from '..';

export const dbFilePath = getDatabasePath();
export const dbDir = path.dirname(dbFilePath);

void initializeDatabase();

async function initializeDatabase() {
  logger.info('Initializing database...');
  logger.info(`Target database directory: ${dbDir}`);
  logger.info(`Target database file: ${dbFilePath}`);

  if (!fs.existsSync(dbDir)) {
    logger.info(`Directory ${dbDir} does not exist. Creating it...`);
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      logger.info(`Directory ${dbDir} created successfully.`);
    } catch (err) {
      logger.error(`Error creating directory ${dbDir}:`, err);
      process.exit(1);
    }
  } else {
    logger.info(`Directory ${dbDir} already exists.`);
  }

  let db: Database;
  try {
    db = await open({ filename: dbFilePath, driver: sqlite3.Database });
  } catch (err) {
    logger.error('Error opening database: %s', err);
    return process.exit(1);
  }
  logger.info(`Successfully connected to/created database at ${dbFilePath}`);

  try {
    // D-055: tables only. A new database starts empty; existing data is never modified.
    await createTables(db);
  } catch (error) {
    logger.error('Error initializing database: %s', error);
  } finally {
    // Closed only once every statement above has completed (issue #52).
    await db.close();
  }
  logger.info('Database initialization complete');
}

async function createTables(db: Database) {
  logger.info('Creating tables');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      icon TEXT,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER NOT NULL,
      cash_amount INTEGER,
      card_amount INTEGER
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      discountedAmount INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id),
      PRIMARY KEY (order_id, product_id)
    )
  `);

  logger.info('Tables created');
}
