import { openDb } from '../db';
import { CategoryType } from 'shared-ts';
import { NotFoundError } from '../types/errors';
import logger from '../utils/logger';

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

  async deleteCategory(categoryId: number): Promise<void> {
    let db;
    try {
      db = await openDb();
      await db.exec('BEGIN TRANSACTION');

      // First, delete all products associated with the category
      await db.run('DELETE FROM products WHERE category_id = ?', [categoryId]);

      // Then, delete the category itself
      const result = await db.run('DELETE FROM categories WHERE id = ?', [categoryId]);

      if (result.changes === 0) {
        // If no category was deleted, it means it wasn't found.
        throw new NotFoundError(`Category with ID ${categoryId} not found.`);
      }

      await db.exec('COMMIT');
      logger.info('Category and associated products deleted for ID: %s', categoryId);
    } catch (error) {
      if (db) await db.exec('ROLLBACK');
      throw error; // Re-throw the original error (e.g., NotFoundError or a generic Error)
    } finally {
      await db?.close();
    }
  }
}
