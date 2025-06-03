import { Logger } from 'pino';
import { OrderController } from '../order.controller';
import type { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError } from '../../types/errors';

describe('OrderController', () => {
  let controller: OrderController;
  let mockOrderService: {
    getAllOrders: jest.Mock;
    createOrder: jest.Mock;
    deleteOrder: jest.Mock;
  };
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    mockOrderService = {
      getAllOrders: jest.fn(),
      createOrder: jest.fn(),
      deleteOrder: jest.fn(),
    };
    controller = new OrderController();
    controller['orderService'] = mockOrderService;

    req = {
      params: {},
      body: [],
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as Logger,
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return all orders', async () => {
    const orders = [{ id: 1, date: 123, items: [] }];
    mockOrderService.getAllOrders.mockResolvedValue(orders);

    await controller.getAllOrders(req as Request, res as Response, next as NextFunction);

    expect(mockOrderService.getAllOrders).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(orders);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle error in getAllOrders', async () => {
    const error = new Error('fail');
    mockOrderService.getAllOrders.mockRejectedValue(error);

    await controller.getAllOrders(req as Request, res as Response, next as NextFunction);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should create an order', async () => {
    const newOrder = { id: 42 };
    req.body = [{ product: { id: 1, name: 'A', price: 10 }, quantity: 2, discountedAmount: 0 }];
    mockOrderService.createOrder.mockResolvedValue(newOrder);

    await controller.createOrder(req as Request, res as Response, next as NextFunction);

    expect(mockOrderService.createOrder).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newOrder);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if cartItems is not an array', async () => {
    req.body = {};
    await controller.createOrder(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid request body: Expected an array of cart items.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle ValidationError in createOrder', async () => {
    const error = new ValidationError('bad');
    req.body = [];
    mockOrderService.createOrder.mockRejectedValue(error);

    await controller.createOrder(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle other errors in createOrder', async () => {
    const error = new Error('fail');
    req.body = [];
    mockOrderService.createOrder.mockRejectedValue(error);

    await controller.createOrder(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should delete an order', async () => {
    req.params = { id: '1' };
    mockOrderService.deleteOrder.mockResolvedValue(undefined);

    await controller.deleteOrder(req as Request, res as Response, next as NextFunction);

    expect(mockOrderService.deleteOrder).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid order ID', async () => {
    req.params = { id: 'not-a-number' };

    await controller.deleteOrder(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid order ID format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle NotFoundError in deleteOrder', async () => {
    req.params = { id: '1' };
    const error = new NotFoundError('not found');
    mockOrderService.deleteOrder.mockRejectedValue(error);

    await controller.deleteOrder(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle ValidationError in deleteOrder', async () => {
    req.params = { id: '1' };
    const error = new ValidationError('bad');
    mockOrderService.deleteOrder.mockRejectedValue(error);

    await controller.deleteOrder(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle other errors in deleteOrder', async () => {
    req.params = { id: '1' };
    const error = new Error('fail');
    mockOrderService.deleteOrder.mockRejectedValue(error);

    await controller.deleteOrder(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(error);
  });
});
