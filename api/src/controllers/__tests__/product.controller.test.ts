import { ProductController } from '../product.controller';
import { ProductService } from '../../services/product.service';
import { NotFoundError } from '../../types/errors';
import type { Request, Response, NextFunction } from 'express';

jest.mock('../../services/product.service');

describe('ProductController', () => {
  let controller: ProductController;
  let mockProductService: jest.Mocked<ProductService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProductService = new ProductService() as jest.Mocked<ProductService>;
    controller = new ProductController(mockProductService);

    req = {
      body: {},
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as any,
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const products = [{ id: 1, name: 'Test', price: 10, categoryId: 2 }];
      mockProductService.getAllProducts.mockResolvedValue(products);

      await controller.getAllProducts(req as Request, res as Response, next as NextFunction);

      expect(mockProductService.getAllProducts).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(products);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle error in getAllProducts', async () => {
      const error = new Error('fail');
      mockProductService.getAllProducts.mockRejectedValue(error);

      await controller.getAllProducts(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createProduct', () => {
    it('should create a product and return its id', async () => {
      const newProduct = { name: 'Test', price: 10, categoryId: 2 };
      const createdId = 42;
      req.body = newProduct;
      mockProductService.addProduct.mockResolvedValue(createdId);

      await controller.createProduct(req as Request, res as Response, next as NextFunction);

      expect(mockProductService.addProduct).toHaveBeenCalledWith(newProduct);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: createdId });
    });

    it('should return 400 if required fields are missing', async () => {
      req.body = { name: '', price: 'not-a-number', categoryId: null };

      await controller.createProduct(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid product fields' });
      expect(mockProductService.addProduct).not.toHaveBeenCalled();
    });

    it('should handle error in createProduct', async () => {
      const newProduct = { name: 'Test', price: 10, categoryId: 2 };
      req.body = newProduct;
      const error = new Error('fail');
      mockProductService.addProduct.mockRejectedValue(error);

      await controller.createProduct(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProduct', () => {
    const productId = 1;
    const productUpdate = { name: 'Updated Product', price: 199 };

    beforeEach(() => {
      req.params = { productId: String(productId) };
      req.body = productUpdate;
    });

    it('should update a product successfully', async () => {
      mockProductService.updateProduct.mockResolvedValue(undefined);

      await controller.updateProduct(req as Request, res as Response, next as NextFunction);

      expect(mockProductService.updateProduct).toHaveBeenCalledWith(productId, productUpdate);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid product ID', async () => {
      req.params = { productId: 'abc' };

      await controller.updateProduct(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid product ID format' });
      expect(mockProductService.updateProduct).not.toHaveBeenCalled();
    });

    it('should return 400 for an empty request body', async () => {
      req.body = {};

      await controller.updateProduct(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'At least one field to update must be provided',
      });
      expect(mockProductService.updateProduct).not.toHaveBeenCalled();
    });

    it('should return 404 if the product is not found', async () => {
      const error = new NotFoundError(`Product with ID ${productId} not found`);
      mockProductService.updateProduct.mockRejectedValue(error);

      await controller.updateProduct(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle other errors during update', async () => {
      const error = new Error('Database failure');
      mockProductService.updateProduct.mockRejectedValue(error);

      await controller.updateProduct(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteProduct', () => {
    const productId = 1;

    beforeEach(() => {
      req.params = { productId: String(productId) };
    });

    it('should delete a product successfully', async () => {
      mockProductService.deleteProduct.mockResolvedValue(undefined);

      await controller.deleteProduct(req as Request, res as Response, next as NextFunction);

      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(productId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid product ID', async () => {
      req.params = { productId: 'abc' };

      await controller.deleteProduct(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid product ID format' });
      expect(mockProductService.deleteProduct).not.toHaveBeenCalled();
    });

    it('should return 404 if the product to delete is not found', async () => {
      const error = new NotFoundError(`Product with ID ${productId} not found`);
      mockProductService.deleteProduct.mockRejectedValue(error);

      await controller.deleteProduct(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle other errors during deletion', async () => {
      const error = new Error('Database failure');
      mockProductService.deleteProduct.mockRejectedValue(error);

      await controller.deleteProduct(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
