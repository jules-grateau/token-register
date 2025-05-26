import { openDb } from '../db';
import logger from '../utils/logger';
import { ProductType } from 'shared-ts';

export class ProductService {
  async getAllProducts(): Promise<ProductType[]> {
    let db;
    try {
      db = await openDb();
      const products = await db.all<ProductType[]>("SELECT * FROM products");
      return products;
    } catch (error) {
      logger.error('Error fetching products in service: %s', error);
      throw error;
    } finally {
      await db?.close();
    }
  }

  async getProductsByCategoryId(categoryId: number): Promise<ProductType[]> {
    let db;
    try {
      db = await openDb();
      const products = await db.all<ProductType[]>("SELECT * FROM products WHERE category_id = ?", [categoryId]);
      return products;
    } catch (error) {
      logger.error('Error fetching products by category ID in service: %s', error);
      throw error;
    } finally {
      await db?.close();
    }
  }
}