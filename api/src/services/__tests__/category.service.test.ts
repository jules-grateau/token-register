import { CategoryService } from '../category.service';
import * as dbModule from '../../db';

describe('CategoryService (unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return all categories', async () => {
    const mockCategories = [{ id: 1, name: 'Drinks' }];
    const mockAll = jest.fn().mockResolvedValue(mockCategories);
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      all: mockAll,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new CategoryService();
    const categories = await service.getAllCategories();
    expect(categories).toEqual(mockCategories);
    expect(mockAll).toHaveBeenCalledWith('SELECT * FROM categories');
  });

  it('should throw if db.all fails in getAllCategories', async () => {
    const mockAll = jest.fn().mockRejectedValue(new Error('DB Fetch error'));
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      all: mockAll,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const categories = new CategoryService();
    await expect(categories.getAllCategories()).rejects.toThrow(
      'Error fetching categories: Error: DB Fetch error'
    );
  });
});
