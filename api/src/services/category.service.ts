import { openDb } from '../db';
import logger from '../utils/logger';
import { CategoryType } from 'shared-ts';

export class CategoryService {
  async getAllCategories(): Promise<CategoryType[]> {
    let db;
    try {
      db = await openDb();
      const categories = await db.all<CategoryType[]>("SELECT * FROM categories");
      return categories;
    } catch (error) {
      logger.error('Error fetching categories in service: %s', error);
      throw error; 
    } finally {
      await db?.close();
    }
  }
}