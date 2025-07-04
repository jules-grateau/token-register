import sqlite3, { Database } from 'sqlite3';
import logger from '../../utils/logger';
import path from 'path';
import fs from 'fs';
import { getDatabasePath } from '..';

export const dbFilePath = getDatabasePath();
export const dbDir = path.dirname(dbFilePath);

void initializeDatabase();

function initializeDatabase() {
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

  const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return process.exit(1);
    }
    logger.info(`Successfully connected to/created database at ${dbFilePath}`);
  });

  createTables(db);
}

function createTables(db: Database) {
  try {
    logger.info('Creating tables');
    db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date INTEGER NOT NULL
      )
    `);

    db.exec(`
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
    logger.info('Inserting categories and products');

    db.get(`SELECT COUNT(id) as count from categories`, [], (err, row: { count: number }) => {
      if (err) {
        logger.error('Error executing count query on categories table:', err.message);
        insertData(db);
        return;
      }
      const categoryCount = row.count;
      if (categoryCount > 0) {
        logger.info('Database is already populated. Skipping initalization.');
      } else {
        insertData(db);
      }
    });
  } catch (error) {
    logger.error('Error initializing database: %s', error);
  } finally {
    db.close();
  }
}

function insertData(db: Database) {
  db.run(`INSERT OR IGNORE INTO categories (id,name) VALUES (?,?)`, [1, 'Boissons']);
  db.run(`INSERT OR IGNORE INTO categories (id,name) VALUES (?,?)`, [2, 'Salé']);
  db.run(`INSERT OR IGNORE INTO categories (id,name) VALUES (?,?)`, [3, 'Sucré']);
  db.run(`INSERT OR IGNORE INTO categories (id,name) VALUES (?,?)`, [4, 'Eco-cup']);

  const products = [
    { name: 'Bière', price: 3, category_id: 1 },
    { name: 'Soda/Jus de fruit', price: 2, category_id: 1 },
    { name: 'Eau', price: 1, category_id: 1 },
    { name: 'Café/Thé', price: 1, category_id: 1 },
    { name: 'Sandwich Jambon beurre', price: 3, category_id: 2 },
    { name: 'Sandwich Rillette poulet', price: 3, category_id: 2 },
    { name: 'Sandwich Camembert', price: 3, category_id: 2 },
    { name: 'Croque Monsieur', price: 2, category_id: 2 },
    { name: 'Chips', price: 1, category_id: 2 },
    { name: 'Barre chocolatée', price: 1, category_id: 3 },
    { name: 'Bonbons', price: 1, category_id: 3 },
    { name: 'Dessert', price: 2, category_id: 3 },
    { name: 'Crêpes', price: 2, category_id: 3 },
    { name: 'Eco-cup', price: 1, category_id: 4 },
    { name: 'Retour Eco-cup', price: -1, category_id: 4 },
  ];

  // Insert products
  for (const product of products) {
    db.run(`INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)`, [
      product.name,
      product.price,
      product.category_id,
    ]);
  }
  logger.info('Categories and products inserted');
}
