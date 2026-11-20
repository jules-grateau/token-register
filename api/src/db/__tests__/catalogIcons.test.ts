import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { addCatalogIconColumns, getTablesMissingIconColumn } from '../catalogIcons';

// Schema of a database created before the catalog icons (D-046, D-047).
async function createLegacyDb(): Promise<Database> {
  const db = await open({ filename: ':memory:', driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      price INTEGER NOT NULL, category_id INTEGER NOT NULL
    );
    INSERT INTO categories (id, name) VALUES (1, 'Boissons');
    INSERT INTO products (id, name, price, category_id) VALUES (1, 'Poule', 3, 1);
  `);
  return db;
}

describe('catalog icon columns migration', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createLegacyDb();
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds products.icon and categories.icon once, keeping existing rows without icon', async () => {
    expect(await getTablesMissingIconColumn(db)).toEqual(['products', 'categories']);
    expect(await addCatalogIconColumns(db)).toEqual(['products', 'categories']);
    expect(await addCatalogIconColumns(db)).toEqual([]);

    expect(await db.get('SELECT icon FROM products WHERE id = 1')).toEqual({ icon: null });
    expect(await db.get('SELECT icon FROM categories WHERE id = 1')).toEqual({ icon: null });
  });

  it('adds only the missing column', async () => {
    await db.exec('ALTER TABLE products ADD COLUMN icon TEXT');
    expect(await addCatalogIconColumns(db)).toEqual(['categories']);
  });

  it('keeps the existing data of an old version inserting without icon', async () => {
    await addCatalogIconColumns(db);
    await db.run('INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)', ['Eau', 1, 1]);
    expect(await db.get("SELECT icon FROM products WHERE name = 'Eau'")).toEqual({ icon: null });
  });
});
