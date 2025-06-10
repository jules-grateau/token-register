import { openDb } from '../db';
import { ProductType } from 'shared-ts';

export class ProductService {
  async getAllProducts(): Promise<ProductType[]> {
    let db;
    try {
      db = await openDb();
      const products = await db.all<ProductType[]>('SELECT * FROM products');
      return products;
    } catch (error) {
      throw new Error(`Error fetching products: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }

  async getProductsByCategoryId(categoryId: number): Promise<ProductType[]> {
    let db;
    try {
      db = await openDb();
      const products = await db.all<ProductType[]>('SELECT * FROM products WHERE category_id = ?', [
        categoryId,
      ]);
      return products;
    } catch (error) {
      throw new Error(`Error fetching products by category ID: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }

  async addProduct(product: Omit<ProductType, 'id'>): Promise<number> {
    let db;
    try {
      db = await openDb();
      const result = await db.run(
        `INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)`,
        [product.name, product.price, product.categoryId]
      );
      if (!result.lastID) {
        throw new Error('Failed to create the product');
      }

      return result.lastID;
    } catch (error) {
      throw new Error(`Error creating new product in service: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }
}
