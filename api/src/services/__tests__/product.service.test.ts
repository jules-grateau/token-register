import { ProductService } from '../product.service';
import * as dbModule from '../../db';

describe('ProductService (unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return all products', async () => {
    const mockProducts = [
      { id: 1, name: 'Test', price: 10, category_id: 1 },
      { id: 2, name: 'Test2', price: 20, category_id: 2 },
    ];
    const mockAll = jest.fn().mockResolvedValue(mockProducts);
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      all: mockAll,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new ProductService();
    const products = await service.getAllProducts();
    expect(products).toEqual(mockProducts);
    expect(mockAll).toHaveBeenCalledWith('SELECT * FROM products');
  });

  it('should return products by category', async () => {
    const mockProducts = [{ id: 1, name: 'Test', price: 10, category_id: 1 }];
    const mockAll = jest.fn().mockResolvedValue(mockProducts);

    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      all: mockAll,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new ProductService();
    const products = await service.getProductsByCategoryId(1);
    expect(products).toEqual(mockProducts);
    expect(mockAll).toHaveBeenCalledWith('SELECT * FROM products WHERE category_id = ?', [1]);
  });

  it('should throw if db.all fails in getAllProducts', async () => {
    const mockAll = jest.fn().mockRejectedValue(new Error('DB Fetch error'));
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      all: mockAll,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new ProductService();
    await expect(service.getAllProducts()).rejects.toThrow(
      'Error fetching products: Error: DB Fetch error'
    );
  });

  it('should throw if db.all fails in getAllProductsByCategory', async () => {
    const mockAll = jest.fn().mockRejectedValue(new Error('DB Fetch error'));
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      all: mockAll,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new ProductService();
    await expect(service.getProductsByCategoryId(1)).rejects.toThrow(
      'Error fetching products by category ID: Error: DB Fetch error'
    );
  });
});
