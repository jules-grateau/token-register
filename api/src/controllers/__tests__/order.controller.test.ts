import { Logger } from 'pino';
import { OrderController } from '../order.controller';
import type { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError } from '../../types/errors';
import { OrderService } from '../../services/order.service';

jest.mock('../../services/order.service');

describe('OrderController', () => {
  let controller: OrderController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  let mockOrderService: jest.Mocked<OrderService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as Logger,
      body: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    nextFunction = jest.fn();

    mockOrderService = new OrderService() as jest.Mocked<OrderService>;
    controller = new OrderController(mockOrderService);
  });

  describe('getAllOrders', () => {
    it('should return all orders from the service', async () => {
      const paginatedResponse = {
        data: [{ id: 1, date: 123, items: [] }],
        pagination: {
          currentPage: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
        },
      };
      mockOrderService.getAllOrders.mockResolvedValue(paginatedResponse);

      await controller.getAllOrders(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(mockOrderService.getAllOrders).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(paginatedResponse);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should forward errors to the next function', async () => {
      const error = new Error('fail');
      mockOrderService.getAllOrders.mockRejectedValue(error);

      await controller.getAllOrders(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );
      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  describe('createOrder', () => {
    it('should create an order and return 201', async () => {
      const newOrder = { id: 42 };
      mockRequest.body = [
        { product: { id: 1, name: 'A', price: 10 }, quantity: 2, discountedAmount: 0 },
      ];
      mockOrderService.createOrder.mockResolvedValue(newOrder);

      await controller.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(newOrder);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 if cartItems is not an array', async () => {
      mockRequest.body = {};
      await controller.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request body: Expected an array of cart items.',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle ValidationError and return 400', async () => {
      const error = new ValidationError('bad');
      mockRequest.body = [];
      mockOrderService.createOrder.mockRejectedValue(error);

      await controller.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: error.message });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should forward other errors to the next function', async () => {
      const error = new Error('fail');
      mockRequest.body = [];
      mockOrderService.createOrder.mockRejectedValue(error);

      await controller.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteOrder', () => {
    it('should delete an order and return 204', async () => {
      mockRequest.params = { id: '1' };
      mockOrderService.deleteOrder.mockResolvedValue(undefined);

      await controller.deleteOrder(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(mockOrderService.deleteOrder).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid order ID', async () => {
      mockRequest.params = { id: 'not-a-number' };

      await controller.deleteOrder(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid order ID format' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle NotFoundError and return 404', async () => {
      mockRequest.params = { id: '1' };
      const error = new NotFoundError('not found');
      mockOrderService.deleteOrder.mockRejectedValue(error);

      await controller.deleteOrder(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: error.message });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle ValidationError and return 400', async () => {
      mockRequest.params = { id: '1' };
      const error = new ValidationError('bad');
      mockOrderService.deleteOrder.mockRejectedValue(error);

      await controller.deleteOrder(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: error.message });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should forward other errors to the next function', async () => {
      mockRequest.params = { id: '1' };
      const error = new Error('fail');
      mockOrderService.deleteOrder.mockRejectedValue(error);

      await controller.deleteOrder(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction as NextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });
});
