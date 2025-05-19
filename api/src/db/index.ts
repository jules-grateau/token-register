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
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id)
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
    )
  `);

  const count = await db.get('SELECT COUNT(*) as count FROM products'); 
  if (count.count > 0) {
    return db; 
  }
  
  await db.run(`INSERT INTO categories (name) VALUES (?)`, ['Boissons']);
  await db.run(`INSERT INTO categories (name) VALUES (?)`, ['Restauration']);
  await db.run(`INSERT INTO categories (name) VALUES (?)`, ['Snacking']);
  await db.run(`INSERT INTO categories (name) VALUES (?)`, ['Desserts']);
  await db.run(`INSERT INTO categories (name) VALUES (?)`, ['Eco-cup']);

  const products = [
    { name: 'Bière', price: 3, category_id: 1 },
    { name: 'Soda/Jus de fruit', price: 2, category_id: 1 },
    { name: 'Eau', price: 1, category_id: 1 },
    { name: 'Café/Thé', price: 1, category_id: 1 },
    { name: 'Sandwich Jambon beurre', price: 3, category_id: 2 },
    { name: 'Sandwich Rillette poulet', price: 3, category_id: 2 },
    { name: 'Sandwich Camembert', price: 3, category_id: 2 },
    { name: 'Croque Monsieur', price: 2, category_id: 2 },
    { name: 'Chips', price: 1, category_id: 3 },
    { name: 'Dessert', price: 2, category_id: 4 },
    { name: 'Crêpes', price: 2, category_id: 4 },
    { name: 'Eco-cup', price: 1, category_id: 5 },
    { name: 'Retour Eco-cup', price: -1, category_id: 5 },
  ]

  // Insert products
  for (const product of products) {
    await db.run(`INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)`, [product.name, product.price, product.category_id]);
  }
  return db;
}