import { OrderService } from '../order.service';
import * as dbModule from '../../db';
import { NotFoundError, ValidationError } from '../../types/errors';

describe('OrderService (unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return all orders', async () => {
    const mockRows = [
      {
        order_id: 1,
        date: 123,
        name: 'Test',
        product_id: 1,
        price: 10,
        quantity: 2,
        discountedAmount: 0,
      },
    ];
    const mockAll = jest.fn().mockResolvedValue(mockRows);
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      all: mockAll,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new OrderService();
    const orders = await service.getAllOrders();
    expect(orders.length).toBe(1);
    expect(orders[0].id).toBe(1);
    expect(mockAll).toHaveBeenCalled();
  });

  it('should throw ValidationError if cart is empty', async () => {
    const service = new OrderService();
    await expect(service.createOrder([])).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for invalid discount when discountedAmount is bigger than price', async () => {
    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10 },
        quantity: 9,
        discountedAmount: 100,
      },
    ];
    await expect(service.createOrder(cart)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for invalid discount when discountedAmount is negative', async () => {
    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10 },
        quantity: 10,
        discountedAmount: -1,
      },
    ];
    await expect(service.createOrder(cart)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for invalid quantity', async () => {
    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10 },
        quantity: 0,
        discountedAmount: 0,
      },
    ];
    await expect(service.createOrder(cart)).rejects.toThrow(ValidationError);
  });

  it('should delete order', async () => {
    const mockExec = jest.fn();
    const mockRun = jest
      .fn()
      .mockResolvedValueOnce({ changes: 1 }) // order_items delete
      .mockResolvedValueOnce({ changes: 1 }); // orders delete
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      exec: mockExec,
      run: mockRun,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new OrderService();
    await expect(service.deleteOrder(1)).resolves.toBeUndefined();
    expect(mockRun).toHaveBeenCalledWith('DELETE FROM order_items WHERE order_id = ?', [1]);
    expect(mockRun).toHaveBeenCalledWith('DELETE FROM orders WHERE id = ?', [1]);
  });

  it('should throw NotFoundError if order not found on delete', async () => {
    const mockExec = jest.fn();
    const mockRun = jest
      .fn()
      .mockResolvedValueOnce({ changes: 0 }) // order_items delete
      .mockResolvedValueOnce({ changes: 0 }); // orders delete
    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      exec: mockExec,
      run: mockRun,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new OrderService();
    await expect(service.deleteOrder(1)).rejects.toThrow(NotFoundError);
  });

  it('should throw an error if db.run fails during deleteOrder', async () => {
    const mockExec = jest.fn();

    const mockRun = jest.fn().mockRejectedValueOnce(new Error('DB delete error'));

    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      exec: mockExec,
      run: mockRun,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new OrderService();

    await expect(service.deleteOrder(1)).rejects.toThrow(
      'Error delete order in service: Error: DB delete error'
    );
    expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should create an order successfully', async () => {
    const mockExec = jest.fn();
    const mockRun = jest
      .fn()
      .mockResolvedValueOnce({ lastID: 42 }) // orders insert
      .mockResolvedValueOnce({}); // order_items insert

    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      exec: mockExec,
      run: mockRun,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10 },
        quantity: 2,
        discountedAmount: 0,
      },
    ];

    const result = await service.createOrder(cart);

    expect(mockExec).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith('INSERT INTO orders (date) VALUES (?)', expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith(
      'INSERT INTO order_items (order_id, product_id, quantity, discountedAmount) VALUES (?, ?, ?, ?)',
      [42, 1, 2, 0]
    );
    expect(mockExec).toHaveBeenCalledWith('COMMIT');
    expect(result).toEqual({ id: 42 });
  });

  it('should rollback and throw if db.run fails during order creation', async () => {
    const mockExec = jest.fn();

    const mockRun = jest.fn().mockRejectedValueOnce(new Error('DB insert error'));

    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      exec: mockExec,
      run: mockRun,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10 },
        quantity: 2,
        discountedAmount: 0,
      },
    ];

    await expect(service.createOrder(cart)).rejects.toThrow('DB insert error');
    expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should throw if db.all fails in getAllOrders', async () => {
    const mockAll = jest.fn().mockRejectedValue(new Error('DB fetch error'));

    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      all: mockAll,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new OrderService();
    await expect(service.getAllOrders()).rejects.toThrow(
      'Error fetching orders: Error: DB fetch error'
    );
  });

  it('should throw if orderResult.lastID is falsy', async () => {
    const mockExec = jest.fn();

    const mockRun = jest.fn().mockResolvedValueOnce({ lastID: undefined }); // Failed insert

    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      exec: mockExec,
      run: mockRun,
      close: jest.fn(),
    } as unknown as Awaited<ReturnType<typeof dbModule.openDb>>);

    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10 },
        quantity: 2,
        discountedAmount: 0,
      },
    ];

    await expect(service.createOrder(cart)).rejects.toThrow('Failed to create order record.');
    expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
  });
});
