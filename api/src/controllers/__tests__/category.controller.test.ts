import { Logger } from 'pino';
import { CategoryController } from '../category.controller';
import type { Request, Response, NextFunction } from 'express';

describe('CategoryController', () => {
  let controller: CategoryController;
  let mockCategoryService: {
    getAllCategories: jest.Mock;
    addCategory: jest.Mock;
    deleteCategory: jest.Mock;
  };
  let mockProductService: {
    getAllProducts: jest.Mock;
    getProductsByCategoryId: jest.Mock;
    addProduct: jest.Mock;
  };
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    mockCategoryService = {
      getAllCategories: jest.fn(),
      addCategory: jest.fn(),
      deleteCategory: jest.fn(),
    };
    mockProductService = {
      getAllProducts: jest.fn(),
      getProductsByCategoryId: jest.fn(),
      addProduct: jest.fn(),
    };
    controller = new CategoryController();
    controller['categoryService'] = mockCategoryService;
    controller['productService'] = mockProductService;

    req = {
      params: {},
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as Logger,
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should return all categories', async () => {
    const categories = [{ id: 1, name: 'Drinks' }];
    mockCategoryService.getAllCategories.mockResolvedValue(categories);

    await controller.getAllCategories(req as Request, res as Response, next as NextFunction);

    expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(categories);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle error in getAllCategories', async () => {
    const error = new Error('fail');
    mockCategoryService.getAllCategories.mockRejectedValue(error);

    await controller.getAllCategories(req as Request, res as Response, next as NextFunction);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should return products by category', async () => {
    req.params = { categoryId: '2' };
    const products = [{ id: 1, name: 'Test', price: 10, category_id: 2 }];
    mockProductService.getProductsByCategoryId.mockResolvedValue(products);

    await controller.getProductsByCategory(req as Request, res as Response, next as NextFunction);

    expect(mockProductService.getProductsByCategoryId).toHaveBeenCalledWith(2);
    expect(res.json).toHaveBeenCalledWith(products);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid categoryId', async () => {
    req.params = { categoryId: 'not-a-number' };

    await controller.getProductsByCategory(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid category ID format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle error in getProductsByCategory', async () => {
    req.params = { categoryId: '2' };
    const error = new Error('fail');
    mockProductService.getProductsByCategoryId.mockRejectedValue(error);

    await controller.getProductsByCategory(req as Request, res as Response, next as NextFunction);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should create a category and return its id', async () => {
    const newCategory = { name: 'New Category' };
    const createdId = 99;
    req.body = newCategory;
    mockCategoryService.addCategory.mockResolvedValue(createdId);

    await controller.addCategory(req as Request, res as Response, next as NextFunction);

    expect(mockCategoryService.addCategory).toHaveBeenCalledWith(newCategory);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: createdId });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if category name is missing', async () => {
    req.body = {};
    await controller.addCategory(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Category name is required' });
    expect(mockCategoryService.addCategory).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle error in addCategory', async () => {
    const newCategory = { name: 'New Category' };
    req.body = newCategory;
    const error = new Error('fail');
    mockCategoryService.addCategory.mockRejectedValue(error);

    await controller.addCategory(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(error);
  });
});
