import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// We use the 'sqlite' package wrapper for Promises on top of sqlite3
// You need to install it: npm install sqlite

// Async function to open the DB connection
export async function openDb() {
  const db = await open({
    filename: path.resolve(__dirname, './data/database.sqlite'),  // SQLite file path in your backend root
    driver: sqlite3.Database
  });

  console.log('Initializing database...');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id),
      PRIMARY KEY (order_id, product_id)
    -- Note: The primary key is a composite key of order_id and product_id
    )
  `);

  const count = await db.get('SELECT COUNT(*) as count FROM products'); 
  if (count.count > 0) {
    return db; // If there are already products, don't insert again
  }
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Bière', 3]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Soda/Jus de fruit', 2]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Eau', 1]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Café/Thé', 1]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Sandwich Jambon beurre', 3]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Sandwich Rillette poulet', 3]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Sandwich Camembert', 3]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Croque Monsieur', 2]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Chips', 1]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Dessert', 2]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Crêpes', 2]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Eco-cup', 1]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Retour Eco-cup', -1]);

  return db;
}