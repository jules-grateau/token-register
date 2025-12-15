import { CategoryController } from '../category.controller';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { NotFoundError } from '../../types/errors';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../services/category.service');
jest.mock('../../services/product.service');

describe('CategoryController', () => {
  let controller: CategoryController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  let mockCategoryService: jest.Mocked<CategoryService>;
  let mockProductService: jest.Mocked<ProductService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as any,
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    nextFunction = jest.fn();

    mockCategoryService = new CategoryService() as jest.Mocked<CategoryService>;
    mockProductService = new ProductService() as jest.Mocked<ProductService>;

    controller = new CategoryController(mockCategoryService, mockProductService);
  });

  describe('getAllCategories', () => {
    it('should return all categories from the service', async () => {
      const categories = [{ id: 1, name: 'Drinks' }];
      mockCategoryService.getAllCategories.mockResolvedValue(categories);

      await controller.getAllCategories(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(categories);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should forward errors to the next function', async () => {
      const error = new Error('Database failed');
      mockCategoryService.getAllCategories.mockRejectedValue(error);

      await controller.getAllCategories(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products for a valid category ID', async () => {
      const products = [{ id: 1, name: 'Cola', price: 1.5, categoryId: 1 }];
      mockRequest.params = { categoryId: '1' };
      mockProductService.getProductsByCategoryId.mockResolvedValue(products);

      await controller.getProductsByCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockProductService.getProductsByCategoryId).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(products);
    });

    it('should return 400 for an invalid category ID', async () => {
      mockRequest.params = { categoryId: 'invalid' };

      await controller.getProductsByCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid category ID format' });
      expect(mockProductService.getProductsByCategoryId).not.toHaveBeenCalled();
    });
  });

  describe('addCategory', () => {
    it('should add a category and return 201 with the new ID', async () => {
      mockRequest.body = { name: 'Snacks' };
      mockCategoryService.addCategory.mockResolvedValue(123);

      await controller.addCategory(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockCategoryService.addCategory).toHaveBeenCalledWith({ name: 'Snacks' });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ id: 123 });
    });

    it('should return 400 if name is missing', async () => {
      mockRequest.body = {};

      await controller.addCategory(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Category name is required' });
      expect(mockCategoryService.addCategory).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should call the service and return 204 on successful update', async () => {
      mockRequest.params = { categoryId: '1' };
      mockRequest.body = { name: 'Updated Name' };
      mockCategoryService.updateCategory.mockResolvedValue(undefined);

      await controller.updateCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(1, {
        name: 'Updated Name',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid category ID', async () => {
      mockRequest.params = { categoryId: 'abc' };
      mockRequest.body = { name: 'Updated Name' };

      await controller.updateCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid category ID format' });
      expect(mockCategoryService.updateCategory).not.toHaveBeenCalled();
    });

    it('should return 400 if the name is missing from the body', async () => {
      mockRequest.params = { categoryId: '1' };
      mockRequest.body = {}; // No name property

      await controller.updateCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Category name is required' });
      expect(mockCategoryService.updateCategory).not.toHaveBeenCalled();
    });

    it('should return 404 if the service throws a NotFoundError', async () => {
      const notFoundError = new NotFoundError('Category not found');
      mockRequest.params = { categoryId: '999' };
      mockRequest.body = { name: 'Updated Name' };
      mockCategoryService.updateCategory.mockRejectedValue(notFoundError);

      await controller.updateCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: notFoundError.message });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('should call the service and return 204 on successful deletion', async () => {
      mockRequest.params = { categoryId: '1' };
      mockCategoryService.deleteCategory.mockResolvedValue(undefined);

      await controller.deleteCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 400 for an invalid category ID', async () => {
      mockRequest.params = { categoryId: 'xyz' };

      await controller.deleteCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid category ID format' });
    });

    it('should return 404 if the service throws a NotFoundError', async () => {
      const error = new NotFoundError('Category not found');
      mockRequest.params = { categoryId: '999' };
      mockCategoryService.deleteCategory.mockRejectedValue(error);

      await controller.deleteCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
