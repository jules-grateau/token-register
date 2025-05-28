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
}
