import { Router, Request, Response, NextFunction } from 'express';
import type { CurrentCashDayResponseType, PaginationParams } from 'shared-ts';
import { CashDayService } from '../services/cashDay.service';
import { OrderService } from '../services/order.service';
import { ConflictError, NotFoundError, ValidationError } from '../types/errors';
import { getAuthUserId, requirePermission } from '../middleware/auth';

/** Route ids are positive integers only ("12", not "12abc" or "-1"). */
const parseId = (value: unknown): number | null => {
  if (typeof value !== 'string' || !/^\d{1,15}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
};

const parsePagination = (query: Request['query']): PaginationParams | null => {
  const read = (value: unknown, fallback: number) =>
    value === undefined ? fallback : typeof value === 'string' ? parseInt(value, 10) : NaN;
  const page = read(query.page, 1);
  const pageSize = read(query.pageSize, 20);
  return Number.isNaN(page) || Number.isNaN(pageSize) ? null : { page, pageSize };
};

/**
 * Cash days (D-061). The request bodies are ignored: opening and closing take no input.
 * - GET    /cash-days/current                : { cashDay } (null when none is open)
 * - POST   /cash-days                        : opens a day (409 CASH_DAY_ALREADY_OPEN)
 * - POST   /cash-days/current/close          : closes the open day (409 NO_OPEN_CASH_DAY)
 * - GET    /cash-days                        : closed days, most recent first (50 at most)
 * - GET    /cash-days/:id/orders             : orders of a day, paginated like /orders
 * - DELETE /cash-days/:id/orders/:orderId    : deletes an order of that day (answer 16 a)
 */
export class CashDayController {
  public path = '/cash-days';
  public router = Router();

  constructor(
    private readonly cashDayService: CashDayService,
    private readonly orderService: OrderService
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // D-063: the state of the open day is needed to sell; the rest needs "cash_day".
    this.router.get('/', requirePermission('cash_day'), this.listClosed);
    this.router.post('/', requirePermission('cash_day'), this.open);
    this.router.get('/current', requirePermission('sale'), this.getCurrent);
    this.router.post('/current/close', requirePermission('cash_day'), this.closeCurrent);
    this.router.get('/:id/orders', requirePermission('cash_day'), this.getOrders);
    this.router.delete('/:id/orders/:orderId', requirePermission('order_delete'), this.deleteOrder);
  }

  private handleError(error: unknown, res: Response, next: NextFunction) {
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message, ...(error.code ? { code: error.code } : {}) });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message, ...(error.code ? { code: error.code } : {}) });
    } else {
      next(error);
    }
  }

  public getCurrent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body: CurrentCashDayResponseType = { cashDay: await this.cashDayService.getCurrent() };
      res.json(body);
    } catch (error) {
      req.log.error('Controller Error: Error fetching the current cash day: %s', error);
      this.handleError(error, res, next);
    }
  };

  public listClosed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.cashDayService.listClosed());
    } catch (error) {
      req.log.error('Controller Error: Error fetching cash days: %s', error);
      this.handleError(error, res, next);
    }
  };

  public open = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.log.info('Controller: Opening a cash day');
    try {
      // D-063, point 14: who opened and who closed the day are recorded, not shown yet.
      res.status(201).json(await this.cashDayService.open(getAuthUserId(res)));
    } catch (error) {
      req.log.error('Controller Error: Error opening a cash day: %s', error);
      this.handleError(error, res, next);
    }
  };

  public closeCurrent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.log.info('Controller: Closing the cash day');
    try {
      res.json(await this.cashDayService.closeCurrent(getAuthUserId(res)));
    } catch (error) {
      req.log.error('Controller Error: Error closing the cash day: %s', error);
      this.handleError(error, res, next);
    }
  };

  public getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Invalid cash day ID format' });
      return;
    }
    const pagination = parsePagination(req.query);
    if (!pagination) {
      res.status(400).json({ error: 'Invalid pagination parameters' });
      return;
    }
    try {
      await this.cashDayService.getById(id);
      res.json(await this.orderService.getAllOrders(pagination, { cashDayId: id }));
    } catch (error) {
      req.log.error(`Controller Error: Error fetching the orders of cash day ${id}: %s`, error);
      this.handleError(error, res, next);
    }
  };

  public deleteOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseId(req.params.id);
    const orderId = parseId(req.params.orderId);
    if (id === null || orderId === null) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }
    req.log.info(`Controller: Deleting order ${orderId} of cash day ${id}`);
    try {
      await this.orderService.deleteOrder(orderId, { cashDayId: id });
      res.status(204).send();
    } catch (error) {
      req.log.error(`Controller Error: Error deleting order ${orderId} of day ${id}: %s`, error);
      this.handleError(error, res, next);
    }
  };
}
