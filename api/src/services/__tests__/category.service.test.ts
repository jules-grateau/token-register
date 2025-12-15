import { CategoryService } from '../category.service';
import * as dbModule from '../../db';
import { NotFoundError } from '../../types/errors';

// Define a type for our mock database object to avoid 'unknown'
type MockDb = Awaited<ReturnType<typeof dbModule.openDb>>;

describe('CategoryService (unit)', () => {
  // Centralize mock objects
  let mockRun: jest.Mock;
  let mockAll: jest.Mock;
  let mockExec: jest.Mock;
  let mockClose: jest.Mock;

  beforeEach(() => {
    // Reset mocks and set up the shared openDb spy before each test
    mockRun = jest.fn();
    mockAll = jest.fn();
    mockExec = jest.fn();
    mockClose = jest.fn().mockResolvedValue(undefined);

    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      run: mockRun,
      all: mockAll,
      exec: mockExec,
      close: mockClose,
    } as unknown as MockDb);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return all categories', async () => {
    const mockCategories = [{ id: 1, name: 'Drinks' }];
    mockAll.mockResolvedValue(mockCategories);

    const service = new CategoryService();
    const categories = await service.getAllCategories();
    expect(categories).toEqual(mockCategories);
    expect(mockAll).toHaveBeenCalledWith('SELECT * FROM categories');
  });

  it('should throw if db.all fails in getAllCategories', async () => {
    mockAll.mockRejectedValue(new Error('DB Fetch error'));

    const categories = new CategoryService();
    await expect(categories.getAllCategories()).rejects.toThrow(
      'Error fetching categories: Error: DB Fetch error'
    );
  });

  it('should add a category and return its id', async () => {
    mockRun.mockResolvedValue({ lastID: 55 });

    const service = new CategoryService();
    const id = await service.addCategory({ name: 'New Category' });

    expect(mockRun).toHaveBeenCalledWith('INSERT INTO categories (name) VALUES (?)', [
      'New Category',
    ]);
    expect(id).toBe(55);
  });

  it('should throw if lastID is falsy', async () => {
    mockRun.mockResolvedValue({ lastID: undefined });

    const service = new CategoryService();
    await expect(service.addCategory({ name: 'New Category' })).rejects.toThrow(
      'Failed to create the category'
    );
  });

  it('should throw if db.run fails', async () => {
    mockRun.mockRejectedValue(new Error('DB insert error'));

    const service = new CategoryService();
    await expect(service.addCategory({ name: 'New Category' })).rejects.toThrow(
      'Error creating new category in service: Error: DB insert error'
    );
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      mockRun.mockResolvedValue({ changes: 1 });
      const service = new CategoryService();
      const categoryUpdate = { name: 'Updated Drinks' };

      await service.updateCategory(1, categoryUpdate);

      expect(mockRun).toHaveBeenCalledWith('UPDATE categories SET name = ? WHERE id = ?', [
        categoryUpdate.name,
        1,
      ]);
    });

    it('should throw NotFoundError if the category to update does not exist', async () => {
      mockRun.mockResolvedValue({ changes: 0 });
      const service = new CategoryService();
      await expect(service.updateCategory(999, { name: 'Does not exist' })).rejects.toThrow(
        new NotFoundError('Category with ID 999 not found.')
      );
    });

    it('should throw if db.run fails during update', async () => {
      mockRun.mockRejectedValue(new Error('DB update error'));
      const service = new CategoryService();
      await expect(service.updateCategory(1, { name: 'Fail' })).rejects.toThrow('DB update error');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category and its products within a transaction', async () => {
      const mockRun = jest.fn().mockResolvedValue({ changes: 1 });
      (dbModule.openDb as jest.Mock).mockResolvedValue({
        run: mockRun,
        exec: mockExec,
        close: mockClose,
      } as unknown as MockDb);
      const service = new CategoryService();
      await service.deleteCategory(1);

      expect(mockExec).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockRun).toHaveBeenCalledWith('DELETE FROM products WHERE category_id = ?', [1]);
      expect(mockRun).toHaveBeenCalledWith('DELETE FROM categories WHERE id = ?', [1]);
      expect(mockExec).toHaveBeenCalledWith('COMMIT');
      expect(mockClose).toHaveBeenCalled();
    });

    it('should throw NotFoundError if the category does not exist and rollback', async () => {
      // First call to delete products is fine, second to delete category finds nothing.
      const mockRun = jest
        .fn()
        .mockResolvedValueOnce({ changes: 5 })
        .mockResolvedValueOnce({ changes: 0 });

      (dbModule.openDb as jest.Mock).mockResolvedValue({
        run: mockRun,
        exec: mockExec,
        close: mockClose,
      } as unknown as MockDb);
      const service = new CategoryService();
      await expect(service.deleteCategory(999)).rejects.toThrow(
        new NotFoundError('Category with ID 999 not found.')
      );

      expect(mockExec).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
      expect(mockExec).not.toHaveBeenCalledWith('COMMIT');
      expect(mockClose).toHaveBeenCalled();
    });

    it('should rollback the transaction if deleting products fails', async () => {
      const dbError = new Error('DB write error');
      mockRun.mockRejectedValue(dbError);

      const service = new CategoryService();
      await expect(service.deleteCategory(1)).rejects.toThrow(dbError);

      expect(mockExec).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
      expect(mockExec).not.toHaveBeenCalledWith('COMMIT');
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
