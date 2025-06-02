import fs from 'fs';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';

const tempDbPath = path.join(os.tmpdir(), `test-db-${Date.now()}.sqlite`);

beforeAll(() => {
  process.env.DATABASE_PATH = tempDbPath;
  if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
});

afterAll(() => {
  if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
});

it('should create all tables', async () => {
  await import('../initDb');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const db = new sqlite3.Database(tempDbPath);

  await new Promise<void>((resolve, reject) => {
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table'",
      (err: Error | null, tables: { name: string }[]) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }
        const tableNames = tables.map((t) => t.name);
        try {
          expect(tableNames).toEqual(
            expect.arrayContaining(['categories', 'products', 'orders', 'order_items'])
          );
          resolve();
        } catch (e) {
          db.close();
          reject(new Error(String(e)));
          return;
        }
      }
    );
    db.close();
  });
});
