import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import logger from '../../utils/logger';
import path from 'path';
import fs from 'fs';
import { getDatabasePath } from '..';
import { getConfiguredCurrency } from '../../utils/currency';

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
    await createTables(db);
    await seedSampleCatalogIfEmpty(db);
  } catch (error) {
    logger.error('Error initializing database: %s', error);
  } finally {
    // Closed only once every statement above has completed (issue #52).
    await db.close();
  }
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

async function seedSampleCatalogIfEmpty(db: Database) {
  logger.info('Inserting categories and products');

  let categoryCount: number;
  try {
    const row = await db.get<{ count: number }>(`SELECT COUNT(id) as count from categories`);
    categoryCount = row?.count ?? 0;
  } catch (err) {
    logger.error('Error executing count query on categories table: %s', err);
    await insertData(db);
    return;
  }

  if (categoryCount > 0) {
    logger.info('Database is already populated. Skipping initalization.');
  } else if (shouldSeedSampleCatalog()) {
    await insertData(db);
  } else {
    logger.info('EUR instance: starting with an empty catalog (no sample data).');
  }
}

/** D-014: a new EUR instance starts with an empty catalog; token instances keep the sample one. */
function shouldSeedSampleCatalog(): boolean {
  return getConfiguredCurrency() !== 'EUR';
}

// Sample catalog of token instances and of the demo. Icons: keys of docs/design/icons.md.
async function insertData(db: Database) {
  const categories = [
    { id: 1, name: 'Boissons', icon: 'beer' },
    { id: 2, name: 'Salé', icon: 'sandwich' },
    { id: 3, name: 'Sucré', icon: 'cake' },
    { id: 4, name: 'Eco-cup', icon: 'deposit' },
  ];

  const products = [
    { name: 'Bière', price: 3, category_id: 1, icon: 'beer' },
    { name: 'Soda/Jus de fruit', price: 2, category_id: 1, icon: 'soft_drink' },
    { name: 'Eau', price: 1, category_id: 1, icon: 'water' },
    { name: 'Café/Thé', price: 1, category_id: 1, icon: 'coffee' },
    { name: 'Sandwich Jambon beurre', price: 3, category_id: 2, icon: 'sandwich' },
    { name: 'Sandwich Rillette poulet', price: 3, category_id: 2, icon: 'sandwich' },
    { name: 'Sandwich Camembert', price: 3, category_id: 2, icon: 'cheese' },
    { name: 'Croque Monsieur', price: 2, category_id: 2, icon: 'sandwich' },
    { name: 'Chips', price: 1, category_id: 2, icon: 'snack' },
    { name: 'Barre chocolatée', price: 1, category_id: 3, icon: 'candy' },
    { name: 'Bonbons', price: 1, category_id: 3, icon: 'candy' },
    { name: 'Dessert', price: 2, category_id: 3, icon: 'cake' },
    { name: 'Crêpes', price: 2, category_id: 3, icon: 'cookie' },
    { name: 'Eco-cup', price: 1, category_id: 4, icon: 'cup' },
    { name: 'Retour Eco-cup', price: -1, category_id: 4, icon: 'deposit' },
  ];

  // D-054: a failed insert is logged and the next ones still run; the app starts anyway.
  let failures = 0;
  const insert = async (sql: string, params: (string | number)[], label: string) => {
    try {
      await db.run(sql, params);
    } catch (err) {
      failures++;
      logger.error(`Error inserting sample ${label}: %s`, err);
    }
  };

  for (const category of categories) {
    await insert(
      `INSERT OR IGNORE INTO categories (id, name, icon) VALUES (?, ?, ?)`,
      [category.id, category.name, category.icon],
      `category "${category.name}"`
    );
  }

  for (const product of products) {
    await insert(
      `INSERT INTO products (name, price, category_id, icon) VALUES (?, ?, ?, ?)`,
      [product.name, product.price, product.category_id, product.icon],
      `product "${product.name}"`
    );
  }

  if (failures > 0) {
    logger.error(`Sample catalog partially inserted: ${failures} insert(s) failed`);
  }
  logger.info('Categories and products inserted');
}
