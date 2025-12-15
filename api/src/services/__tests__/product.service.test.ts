import { ProductService } from '../product.service';
import * as dbModule from '../../db';
import { NotFoundError } from '../../types/errors';

type MockDb = Awaited<ReturnType<typeof dbModule.openDb>>;

describe('ProductService (unit)', () => {
  let mockRun: jest.Mock;
  let mockAll: jest.Mock;

  beforeEach(() => {
    mockRun = jest.fn();
    mockAll = jest.fn();
    const mockClose = jest.fn().mockResolvedValue(undefined);

    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      run: mockRun,
      all: mockAll,
      close: mockClose,
    } as unknown as MockDb);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return all products', async () => {
    const mockProducts = [{ id: 1, name: 'Test', price: 10, category_id: 1 }];
    mockAll.mockResolvedValue(mockProducts);

    const service = new ProductService();
    const products = await service.getAllProducts();
    expect(products).toEqual(mockProducts);
    expect(mockAll).toHaveBeenCalledWith('SELECT * FROM products');
  });

  it('should return products by category', async () => {
    const mockProducts = [{ id: 1, name: 'Test', price: 10, category_id: 1 }];
    mockAll.mockResolvedValue(mockProducts);

    const service = new ProductService();
    const products = await service.getProductsByCategoryId(1);
    expect(products).toEqual(mockProducts);
    expect(mockAll).toHaveBeenCalledWith('SELECT * FROM products WHERE category_id = ?', [1]);
  });

  it('should throw if db.all fails in getAllProducts', async () => {
    mockAll.mockRejectedValue(new Error('DB Fetch error'));

    const service = new ProductService();
    await expect(service.getAllProducts()).rejects.toThrow(
      'Error fetching products: Error: DB Fetch error'
    );
  });

  it('should throw if db.all fails in getAllProductsByCategory', async () => {
    mockAll.mockRejectedValue(new Error('DB Fetch error'));

    const service = new ProductService();
    await expect(service.getProductsByCategoryId(1)).rejects.toThrow(
      'Error fetching products by category ID: Error: DB Fetch error'
    );
  });

  it('should add a product and return its id', async () => {
    mockRun.mockResolvedValue({ lastID: 123 });

    const service = new ProductService();
    const product = { name: 'New Product', price: 99, categoryId: 2 };
    const id = await service.addProduct(product);

    expect(mockRun).toHaveBeenCalledWith(
      `INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)`,
      [product.name, product.price, product.categoryId]
    );
    expect(id).toBe(123);
  });

  it('should throw if lastID is falsy', async () => {
    mockRun.mockResolvedValue({ lastID: undefined });

    const service = new ProductService();
    const product = { name: 'New Product', price: 99, categoryId: 2 };
    await expect(service.addProduct(product)).rejects.toThrow('Failed to create the product');
  });

  it('should throw if db.run fails', async () => {
    mockRun.mockRejectedValue(new Error('DB insert error'));

    const service = new ProductService();
    const product = { name: 'New Product', price: 99, categoryId: 2 };
    await expect(service.addProduct(product)).rejects.toThrow(
      'Error creating new product in service: Error: DB insert error'
    );
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      mockRun.mockResolvedValue({ changes: 1 });
      const service = new ProductService();
      const productUpdate = { name: 'Updated Product', price: 199, categoryId: 1 };
      const productId = 1;

      await service.updateProduct(productId, productUpdate);

      expect(mockRun).toHaveBeenCalledWith(
        `UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?`,
        [productUpdate.name, productUpdate.price, productUpdate.categoryId, productId]
      );
    });

    it('should build a partial update query correctly', async () => {
      mockRun.mockResolvedValue({ changes: 1 });
      const service = new ProductService();
      const partialUpdate = { price: 250 };
      const productId = 2;

      await service.updateProduct(productId, partialUpdate);

      expect(mockRun).toHaveBeenCalledWith(`UPDATE products SET price = ? WHERE id = ?`, [
        partialUpdate.price,
        productId,
      ]);
    });

    it('should do nothing if no fields are provided for update', async () => {
      const service = new ProductService();
      const productId = 1;
      const emptyUpdate = {};

      await service.updateProduct(productId, emptyUpdate);

      // Expect that no database call was made
      expect(mockRun).not.toHaveBeenCalled();
    });

    it('should throw an error if the product to update is not found', async () => {
      mockRun.mockResolvedValue({ changes: 0 });
      const service = new ProductService();
      const productUpdate = { name: 'Updated Product', price: 199, categoryId: 1 };
      const productId = 999; // Non-existent ID

      await expect(service.updateProduct(productId, productUpdate)).rejects.toThrow(
        new NotFoundError(`Product with ID ${productId} not found`)
      );
    });

    it('should throw an error if db.run fails during update', async () => {
      mockRun.mockRejectedValue(new Error('DB update error'));
      const service = new ProductService();
      const productUpdate = { name: 'Updated Product', price: 199, categoryId: 1 };
      const productId = 1;

      await expect(service.updateProduct(productId, productUpdate)).rejects.toThrow(
        'Error updating product: Error: DB update error'
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      mockRun.mockResolvedValue({ changes: 1 });
      const service = new ProductService();
      const productId = 1;

      await service.deleteProduct(productId);

      expect(mockRun).toHaveBeenCalledWith(`DELETE FROM products WHERE id = ?`, [productId]);
    });

    it('should throw an error if the product to delete is not found', async () => {
      mockRun.mockResolvedValue({ changes: 0 });
      const service = new ProductService();
      const productId = 999; // Non-existent ID

      await expect(service.deleteProduct(productId)).rejects.toThrow(
        new NotFoundError(`Product with ID ${productId} not found`)
      );
    });

    it('should throw an error if db.run fails during deletion', async () => {
      mockRun.mockRejectedValue(new Error('DB delete error'));
      const service = new ProductService();
      const productId = 1;

      await expect(service.deleteProduct(productId)).rejects.toThrow(
        'Error deleting product: Error: DB delete error'
      );
    });
  });
});
