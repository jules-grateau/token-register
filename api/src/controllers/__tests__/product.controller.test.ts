import { Logger } from 'pino';
import { ProductController } from '../product.controller';
import type { Request, Response, NextFunction } from 'express';

describe('ProductController', () => {
  let controller: ProductController;
  let mockProductService: { getAllProducts: jest.Mock; getProductsByCategoryId: jest.Mock };
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    mockProductService = { getAllProducts: jest.fn(), getProductsByCategoryId: jest.fn() };
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
});
