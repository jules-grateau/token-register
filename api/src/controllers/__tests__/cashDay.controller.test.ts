import { Logger } from 'pino';
import type { Request, Response, NextFunction } from 'express';
import { CashDayController } from '../cashDay.controller';
import { CashDayService } from '../../services/cashDay.service';
import { OrderService } from '../../services/order.service';
import { ConflictError, NotFoundError } from '../../types/errors';

jest.mock('../../services/cashDay.service');
jest.mock('../../services/order.service');

const day = {
  id: 3,
  openedAt: 1000,
  closedAt: null,
  summary: { total: 0, cashAmount: null, cardAmount: null, orderCount: 0 },
  announced: null,
  modifiedAfterClose: false,
};

describe('CashDayController (D-061)', () => {
  let controller: CashDayController;
  let cashDays: jest.Mocked<CashDayService>;
  let orders: jest.Mocked<OrderService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  const call = async (handler: keyof CashDayController) => {
    const fn = controller[handler] as (r: Request, s: Response, n: NextFunction) => Promise<void>;
    await fn(req as Request, res as Response, next as NextFunction);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cashDays = new CashDayService() as jest.Mocked<CashDayService>;
    orders = new OrderService() as jest.Mocked<OrderService>;
    controller = new CashDayController(cashDays, orders);
    req = {
      params: {},
      query: {},
      body: { anything: 'ignored' },
      log: { info: jest.fn(), error: jest.fn() } as unknown as Logger,
    };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
    next = jest.fn();
  });

  it('returns the open day, or null', async () => {
    cashDays.getCurrent.mockResolvedValue(null);
    await call('getCurrent');
    expect(res.json).toHaveBeenCalledWith({ cashDay: null });
  });

  it('opens a day (201), ignoring the body', async () => {
    cashDays.open.mockResolvedValue(day);
    await call('open');
    expect(cashDays.open).toHaveBeenCalledWith(null);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(day);
  });

  it('records who opens and who closes the day (D-063, point 14)', async () => {
    res.locals = { user: { id: 4 } };
    cashDays.open.mockResolvedValue(day);
    cashDays.closeCurrent.mockResolvedValue(day);
    await call('open');
    await call('closeCurrent');
    expect(cashDays.open).toHaveBeenCalledWith(4);
    expect(cashDays.closeCurrent).toHaveBeenCalledWith(4);
  });

  it('answers 409 with its code when a day is already open', async () => {
    cashDays.open.mockRejectedValue(new ConflictError('open', 'CASH_DAY_ALREADY_OPEN'));
    await call('open');
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'open', code: 'CASH_DAY_ALREADY_OPEN' });
  });

  it('answers 409 when there is nothing to close', async () => {
    cashDays.closeCurrent.mockRejectedValue(new ConflictError('none', 'NO_OPEN_CASH_DAY'));
    await call('closeCurrent');
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('lists the orders of a day', async () => {
    req.params = { id: '3' };
    req.query = { page: '2', pageSize: '10' };
    cashDays.getById.mockResolvedValue(day);
    const page = {
      data: [],
      pagination: { currentPage: 2, pageSize: 10, totalCount: 0, totalPages: 0 },
    };
    orders.getAllOrders.mockResolvedValue(page);
    await call('getOrders');
    expect(orders.getAllOrders).toHaveBeenCalledWith({ page: 2, pageSize: 10 }, { cashDayId: 3 });
    expect(res.json).toHaveBeenCalledWith(page);
  });

  it('answers 404 for an unknown day', async () => {
    req.params = { id: '9' };
    cashDays.getById.mockRejectedValue(new NotFoundError('nope'));
    await call('getOrders');
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it.each(['abc', '1.5', '-1', '0', '12abc'])('refuses the id "%s"', async (id) => {
    req.params = { id, orderId: '1' };
    await call('deleteOrder');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(orders.deleteOrder).not.toHaveBeenCalled();
  });

  it('deletes an order of a day (204)', async () => {
    req.params = { id: '3', orderId: '7' };
    await call('deleteOrder');
    expect(orders.deleteOrder).toHaveBeenCalledWith(7, { cashDayId: 3 });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('passes unexpected errors to next', async () => {
    const error = new Error('db down');
    cashDays.listClosed.mockRejectedValue(error);
    await call('listClosed');
    expect(next).toHaveBeenCalledWith(error);
  });
});
