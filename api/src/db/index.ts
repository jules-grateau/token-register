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

   // Create a simple table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL
    )
  `);

  const count = await db.get('SELECT COUNT(*) as count FROM products'); 
  if (count.count > 0) {
    return db; // If there are already products, don't insert again
  }
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Bière', 3]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Soda', 2]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Jus de fruit', 2]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Eau', 1]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Café', 1]);
  await db.run(`INSERT INTO products (name, price) VALUES (?, ?)`, ['Thé', 1]);

  return db;
}