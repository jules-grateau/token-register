import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { CartItemType, CreateOrderRequestType, PaginationParams } from 'shared-ts';
import { ValidationError, NotFoundError, ConflictError } from '../types/errors';

export class OrderController {
  public path = '/orders';
  public router = Router();
  private readonly orderService: OrderService;

  constructor(orderService: OrderService) {
    this.orderService = orderService;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllOrders);
    this.router.post('/', this.createOrder);
    this.router.delete('/:id', this.deleteOrder);
  }

  public getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let page: number | undefined;
    let pageSize: number | undefined;

    if (req.query.page) {
      const parsedPage = parseInt(req.query.page as string, 10);
      if (isNaN(parsedPage)) {
        res.status(400).json({ error: 'Invalid page parameter' });
        return;
      }
      page = parsedPage;
    }

    if (req.query.pageSize) {
      const parsedPageSize = parseInt(req.query.pageSize as string, 10);
      if (isNaN(parsedPageSize)) {
        res.status(400).json({ error: 'Invalid pageSize parameter' });
        return;
      }
      pageSize = parsedPageSize;
    }

    const paginationParams: PaginationParams | undefined =
      page !== undefined || pageSize !== undefined
        ? {
            page: page ?? 1,
            pageSize: pageSize ?? 20,
          }
        : undefined;

    req.log.info({ page, pageSize }, 'Controller: Fetching orders with pagination');

    try {
      const result = await this.orderService.getAllOrders(paginationParams);

      res.json(result);
    } catch (error) {
      req.log.error('Controller Error: Error fetching orders: %s', error);
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.log.info('Controller: Creating new order');
    try {
      const body: unknown = req.body;

      // Bare array (clients before 1.3.0): no payment. Accepted on token instances only; an
      // EUR instance refuses it with PAYMENT_REQUIRED (D-035).
      if (Array.isArray(body)) {
        const newOrder = await this.orderService.createOrder(body as CartItemType[], undefined);
        res.status(201).json(newOrder);
        return;
      }

      const { items, payment } = (body ?? {}) as Partial<CreateOrderRequestType>;
      if (!Array.isArray(items)) {
        res.status(400).json({ error: 'Invalid request body: Expected an array of cart items.' });
        return;
      }
      const newOrder = await this.orderService.createOrder(items, payment ?? null);
      res.status(201).json(newOrder);
    } catch (error) {
      req.log.error('Controller Error: Error creating new order: %s', error);
      if (error instanceof ValidationError) {
        res
          .status(400)
          .json(error.code ? { error: error.message, code: error.code } : { error: error.message });
      } else {
        next(error);
      }
    }
  };

  public deleteOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const orderIdParam = req.params.id;
    req.log.info(`Controller: Deleting order with ID: ${orderIdParam}`);
    try {
      const orderId = parseInt(orderIdParam, 10);
      if (isNaN(orderId)) {
        res.status(400).json({ error: 'Invalid order ID format' });
        return;
      }
      await this.orderService.deleteOrder(orderId);
      res.status(204).send();
    } catch (error) {
      req.log.error(`Controller Error: Error deleting order ${orderIdParam}: %s`, error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ConflictError) {
        // D-061: an order of a closed cash day is deleted from that day only.
        res.status(409).json({ error: error.message, code: error.code });
      } else if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };
}
