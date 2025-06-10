import { Logger } from 'pino';
import { ProductController } from '../product.controller';
import type { Request, Response, NextFunction } from 'express';

describe('ProductController', () => {
  let controller: ProductController;
  let mockProductService: {
    getAllProducts: jest.Mock;
    getProductsByCategoryId: jest.Mock;
    addProduct: jest.Mock;
  };
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    mockProductService = {
      getAllProducts: jest.fn(),
      getProductsByCategoryId: jest.fn(),
      addProduct: jest.fn(),
    };
    controller = new ProductController();
    controller['productService'] = mockProductService;

    req = {
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

  it('should return all products', async () => {
    const products = [{ id: 1, name: 'Test', price: 10, category_id: 2 }];
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
