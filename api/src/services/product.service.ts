import { openDb } from '../db';
import { ProductType } from 'shared-ts';
import { NotFoundError } from '../types/errors';

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

  async updateProduct(id: number, product: Partial<Omit<ProductType, 'id'>>): Promise<void> {
    let db;
    try {
      db = await openDb();
      const fields = Object.keys(product)
        .map((key) => (key === 'categoryId' ? 'category_id' : key))
        .map((key) => `${key} = ?`);

      if (fields.length === 0) {
        // Nothing to update
        return;
      }

      const values = Object.values(product);
      const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;

      const result = await db.run(query, [...values, id]);

      if (result.changes === 0) {
        throw new NotFoundError(`Product with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new Error(`Error updating product: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }

  async deleteProduct(id: number): Promise<void> {
    let db;
    try {
      db = await openDb();
      const result = await db.run(`DELETE FROM products WHERE id = ?`, [id]);

      if (result.changes === 0) {
        throw new NotFoundError(`Product with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new Error(`Error deleting product: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }
}
