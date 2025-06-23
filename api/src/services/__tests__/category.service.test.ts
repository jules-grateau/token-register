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

  it('should add a category and return its id', async () => {
    const mockRun = jest.fn().mockResolvedValue({ lastID: 55 });
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      run: mockRun,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new CategoryService();
    const id = await service.addCategory({ name: 'New Category' });

    expect(mockRun).toHaveBeenCalledWith('INSERT INTO categories (name) VALUES (?)', [
      'New Category',
    ]);
    expect(id).toBe(55);
  });

  it('should throw if lastID is falsy', async () => {
    const mockRun = jest.fn().mockResolvedValue({ lastID: undefined });
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      run: mockRun,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new CategoryService();
    await expect(service.addCategory({ name: 'New Category' })).rejects.toThrow(
      'Failed to create the category'
    );
  });

  it('should throw if db.run fails', async () => {
    const mockRun = jest.fn().mockRejectedValue(new Error('DB insert error'));
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      run: mockRun,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new CategoryService();
    await expect(service.addCategory({ name: 'New Category' })).rejects.toThrow(
      'Error creating new category in service: Error: DB insert error'
    );
  });
});
