import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { CartItemType } from 'shared-ts';
import { ValidationError, NotFoundError } from '../types/errors';

export class OrderController {
  public path = '/orders';
  public router = Router();
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllOrders);
    this.router.post('/', this.createOrder);
    this.router.delete('/:id', this.deleteOrder);
  }

  public getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.log.info('Controller: Fetching all orders');
    try {
      const orders = await this.orderService.getAllOrders();
      res.json(orders);
    } catch (error) {
      req.log.error('Controller Error: Error fetching orders: %s', error);
      next(error);
    }
  }

  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.log.info('Controller: Creating new order');
    try {
      const cartItems: CartItemType[] = req.body;
      if (!Array.isArray(cartItems)) { 
        res.status(400).json({ error: "Invalid request body: Expected an array of cart items." });
        return;
      }
      const newOrder = await this.orderService.createOrder(cartItems);
      res.status(201).json(newOrder);
    } catch (error) {
        req.log.error('Controller Error: Error creating new order: %s', error);
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  public deleteOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const orderIdParam = req.params.id;
    req.log.info(`Controller: Deleting order with ID: ${orderIdParam}`);
    try {
      const orderId = parseInt(orderIdParam, 10);
      if (isNaN(orderId)) {
        res.status(400).json({ error: "Invalid order ID format" });
        return;
      }
      await this.orderService.deleteOrder(orderId);
      res.status(204).send();
    } catch (error) {
      req.log.error(`Controller Error: Error deleting order ${orderIdParam}: %s`, error);
      if (error instanceof NotFoundError) {
         res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
         res.status(400).json({ error: error.message });
      }
      else {
        next(error);
      }
    }
  }
}