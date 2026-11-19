import { openDb } from '../db';
import { ProductType } from 'shared-ts';
import { NotFoundError } from '../types/errors';

const UPDATABLE_COLUMNS = {
  name: 'name',
  price: 'price',
  categoryId: 'category_id',
} as const satisfies Record<keyof Omit<ProductType, 'id'>, string>;

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
      // Only whitelisted fields can reach the SQL query: keys come from the request body.
      const entries = Object.entries(product).filter(
        ([key, value]) => Object.prototype.hasOwnProperty.call(UPDATABLE_COLUMNS, key) && value !== undefined
      ) as [keyof typeof UPDATABLE_COLUMNS, unknown][];

      if (entries.length === 0) {
        // Nothing to update
        return;
      }

      const fields = entries.map(([key]) => `${UPDATABLE_COLUMNS[key]} = ?`);
      const values = entries.map(([, value]) => value);
      const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;

      db = await openDb();

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
