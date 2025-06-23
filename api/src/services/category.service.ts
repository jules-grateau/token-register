import { openDb } from '../db';
import { CategoryType } from 'shared-ts';

export class CategoryService {
  async getAllCategories(): Promise<CategoryType[]> {
    let db;
    try {
      db = await openDb();
      const categories = await db.all<CategoryType[]>('SELECT * FROM categories');
      return categories;
    } catch (error) {
      throw new Error(`Error fetching categories: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }

  async addCategory(category: Omit<CategoryType, 'id'>): Promise<number> {
    let db;
    try {
      db = await openDb();
      const result = await db.run(`INSERT INTO categories (name) VALUES (?)`, [category.name]);
      if (!result.lastID) {
        throw new Error('Failed to create the category');
      }

      return result.lastID;
    } catch (error) {
      throw new Error(`Error creating new category in service: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }
}
