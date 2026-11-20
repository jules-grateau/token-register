import { OrderService } from '../order.service';
import * as dbModule from '../../db';
import { NotFoundError, ValidationError } from '../../types/errors';

type MockDb = Awaited<ReturnType<typeof dbModule.openDb>>;

describe('OrderService (unit)', () => {
  let mockRun: jest.Mock;
  let mockAll: jest.Mock;
  let mockGet: jest.Mock;
  let mockExec: jest.Mock;
  let mockClose: jest.Mock;

  beforeEach(() => {
    mockRun = jest.fn();
    mockAll = jest.fn();
    mockGet = jest.fn();
    mockExec = jest.fn();
    mockClose = jest.fn().mockResolvedValue(undefined);

    jest.spyOn(dbModule, 'openDb').mockResolvedValue({
      run: mockRun,
      all: mockAll,
      get: mockGet,
      exec: mockExec,
      close: mockClose,
    } as unknown as MockDb);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return all orders', async () => {
    const mockCountResult = { count: 1 };
    const mockRows = [
      {
        order_id: 1,
        date: 123,
        product_id: 1,
        product_name: 'Test',
        product_price: 10,
        category_name: 'TestCategory',
        quantity: 2,
        discountedAmount: 0,
      },
    ];
    mockGet.mockResolvedValue(mockCountResult); // COUNT query
    mockAll.mockResolvedValue(mockRows); // SELECT query

    const service = new OrderService();
    const result = await service.getAllOrders();
    expect(result.data.length).toBe(1);
    expect(result.data[0].id).toBe(1);
    expect(result.pagination.totalCount).toBe(1);
    expect(mockGet).toHaveBeenCalled();
    expect(mockAll).toHaveBeenCalled();
  });

  it('should throw ValidationError if cart is empty', async () => {
    const service = new OrderService();
    await expect(service.createOrder([])).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for invalid discount when discountedAmount is bigger than price', async () => {
    mockGet.mockResolvedValue({ name: 'A', price: 10, category_name: 'CategoryA' });
    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10, categoryId: 1 },
        quantity: 9,
        discountedAmount: 100,
      },
    ];
    await expect(service.createOrder(cart)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for invalid discount when discountedAmount is negative', async () => {
    mockGet.mockResolvedValue({ name: 'A', price: 10, category_name: 'CategoryA' });
    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10, categoryId: 1 },
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
        product: { id: 1, name: 'A', price: 10, categoryId: 1 },
        quantity: 0,
        discountedAmount: 0,
      },
    ];
    await expect(service.createOrder(cart)).rejects.toThrow(ValidationError);
  });

  it('should delete order', async () => {
    mockRun
      .mockResolvedValueOnce({ changes: 1 }) // order_items delete
      .mockResolvedValueOnce({ changes: 1 }); // orders delete

    const service = new OrderService();
    await expect(service.deleteOrder(1)).resolves.toBeUndefined();
    expect(mockRun).toHaveBeenCalledWith('DELETE FROM order_items WHERE order_id = ?', [1]);
    expect(mockRun).toHaveBeenCalledWith('DELETE FROM orders WHERE id = ?', [1]);
  });

  it('should throw NotFoundError if order not found on delete', async () => {
    mockRun
      .mockResolvedValueOnce({ changes: 0 }) // order_items delete
      .mockResolvedValueOnce({ changes: 0 }); // orders delete

    const service = new OrderService();
    await expect(service.deleteOrder(1)).rejects.toThrow(NotFoundError);
  });

  it('should throw an error if db.run fails during deleteOrder', async () => {
    mockRun.mockRejectedValueOnce(new Error('DB delete error'));

    const service = new OrderService();

    await expect(service.deleteOrder(1)).rejects.toThrow(
      'Error delete order in service: Error: DB delete error'
    );
    expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should create an order successfully', async () => {
    mockGet.mockResolvedValue({ name: 'A', price: 10, category_name: 'CategoryA' }); // product lookup
    mockRun
      .mockResolvedValueOnce({ lastID: 42 }) // orders insert
      .mockResolvedValueOnce({}); // order_items insert

    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10, categoryId: 1 },
        quantity: 2,
        discountedAmount: 0,
      },
    ];

    const result = await service.createOrder(cart);

    expect(mockExec).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith(
      'INSERT INTO orders (date, cash_amount, card_amount) VALUES (?, ?, ?)',
      [expect.any(Number), null, null]
    );
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('FROM products p'), [1]);
    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO order_items'),
      [42, 1, 2, 0, 'A', 10, 'CategoryA']
    );
    expect(mockExec).toHaveBeenCalledWith('COMMIT');
    expect(result).toEqual({ id: 42 });
  });

  it('should snapshot name and price from the database, not from the request', async () => {
    mockGet.mockResolvedValue({ name: 'Bière', price: 3, category_name: 'Boissons' });
    mockRun.mockResolvedValueOnce({ lastID: 7 }).mockResolvedValueOnce({});

    const service = new OrderService();
    const tamperedCart = [
      {
        product: { id: 1, name: 'Free beer', price: 0, categoryId: 99 },
        quantity: 2,
        discountedAmount: 0,
      },
    ];

    await service.createOrder(tamperedCart);

    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO order_items'),
      [7, 1, 2, 0, 'Bière', 3, 'Boissons']
    );
  });

  it('should reject a discount that is not a whole number of units (D-010)', async () => {
    mockGet.mockResolvedValue({ name: 'Bière', price: 250, category_name: 'Boissons' });
    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'Bière', price: 250, categoryId: 1 },
        quantity: 1,
        discountedAmount: 37.5,
      },
    ];

    await expect(service.createOrder(cart)).rejects.toThrow('Invalid discount amount');
    expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should validate the discount against the database price', async () => {
    mockGet.mockResolvedValue({ name: 'Bière', price: 3, category_name: 'Boissons' });
    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'Bière', price: 1000, categoryId: 1 },
        quantity: 1,
        discountedAmount: 500,
      },
    ];

    await expect(service.createOrder(cart)).rejects.toThrow(ValidationError);
    expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should throw ValidationError and rollback if a product does not exist', async () => {
    mockGet.mockResolvedValue(undefined);
    const service = new OrderService();
    const cart = [
      {
        product: { id: 999, name: 'Ghost', price: 1, categoryId: 1 },
        quantity: 1,
        discountedAmount: 0,
      },
    ];

    await expect(service.createOrder(cart)).rejects.toThrow(ValidationError);
    expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('should use a fallback category name when the category is missing', async () => {
    mockGet.mockResolvedValue({ name: 'A', price: 10, category_name: null });
    mockRun.mockResolvedValueOnce({ lastID: 1 }).mockResolvedValueOnce({});
    const service = new OrderService();
    const cart = [
      { product: { id: 1, name: 'A', price: 10, categoryId: 1 }, quantity: 1, discountedAmount: 0 },
    ];

    await service.createOrder(cart);

    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO order_items'),
      [1, 1, 1, 0, 'A', 10, 'Unknown Category']
    );
  });

  it('should rollback and throw if db.run fails during order creation', async () => {
    mockGet.mockResolvedValue({ name: 'A', price: 10, category_name: 'CategoryA' });
    mockRun.mockRejectedValueOnce(new Error('DB insert error'));
    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10, categoryId: 1 },
        quantity: 2,
        discountedAmount: 0,
      },
    ];

    await expect(service.createOrder(cart)).rejects.toThrow('DB insert error');
    expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should throw if db.get fails in getAllOrders', async () => {
    mockGet.mockRejectedValue(new Error('DB count error'));
    const service = new OrderService();
    await expect(service.getAllOrders()).rejects.toThrow(
      'Error fetching orders: Error: DB count error'
    );
  });

  it('should throw if orderResult.lastID is falsy', async () => {
    mockGet.mockResolvedValue({ name: 'A', price: 10, category_name: 'CategoryA' });
    mockRun.mockResolvedValueOnce({ lastID: undefined }); // Failed insert
    const service = new OrderService();
    const cart = [
      {
        product: { id: 1, name: 'A', price: 10, categoryId: 1 },
        quantity: 2,
        discountedAmount: 0,
      },
    ];

    await expect(service.createOrder(cart)).rejects.toThrow('Failed to create order record.');
    expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should return the payment of each order, or null without payment data', async () => {
    mockGet.mockResolvedValue({ count: 2 });
    const base = {
      date: 123,
      product_id: 1,
      product_name: 'Bière',
      product_price: 250,
      category_name: 'Boissons',
      quantity: 3,
      discountedAmount: 0,
    };
    mockAll.mockResolvedValue([
      { ...base, order_id: 2, cash_amount: 500, card_amount: 250 },
      { ...base, order_id: 1, cash_amount: null, card_amount: null },
    ]);

    const result = await new OrderService('EUR').getAllOrders();

    expect(result.data[0].payment).toEqual({ cashAmount: 500, cardAmount: 250 });
    expect(result.data[1].payment).toBeNull();
  });

  describe('payment (D-030 to D-034)', () => {
    const cart = [
      {
        product: { id: 1, name: 'Bière', price: 250, categoryId: 1 },
        quantity: 3,
        discountedAmount: 0,
      },
    ];

    beforeEach(() => {
      // Total = 3 × 2,50 € = 7,50 €.
      mockGet.mockResolvedValue({ name: 'Bière', price: 250, category_name: 'Boissons' });
      mockRun.mockResolvedValueOnce({ lastID: 12 }).mockResolvedValueOnce({});
    });

    const insertedPayment = () => {
      const call = mockRun.mock.calls.find(([sql]) =>
        String(sql).startsWith('INSERT INTO orders')
      );
      return (call?.[1] as unknown[]).slice(1);
    };

    it.each([
      ['card', { cashAmount: null, cardAmount: 750 }, [null, 750]],
      ['cash', { cashAmount: 750, cardAmount: null }, [750, null]],
      ['cash + card', { cashAmount: 500, cardAmount: 250 }, [500, 250]],
    ])('stores a %s payment on an EUR instance', async (_label, payment, expected) => {
      await new OrderService('EUR').createOrder(cart, payment);
      expect(insertedPayment()).toEqual(expected);
      expect(mockExec).toHaveBeenCalledWith('COMMIT');
    });

    it.each([
      ['missing', null],
      ['without any mode', { cashAmount: null, cardAmount: null }],
      ['not adding up to the total', { cashAmount: 500, cardAmount: null }],
      ['above the total', { cashAmount: 2000, cardAmount: null }],
      ['with a zero mode', { cashAmount: 0, cardAmount: 750 }],
      ['with a negative mode', { cashAmount: 1000, cardAmount: -250 }],
      ['not in whole cents', { cashAmount: 749.5, cardAmount: 0.5 }],
    ])('rejects a payment %s on an EUR instance', async (_label, payment) => {
      await expect(new OrderService('EUR').createOrder(cart, payment)).rejects.toThrow(
        ValidationError
      );
      expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
    });

    it('checks the payment against the database total, not the request', async () => {
      const tampered = [{ ...cart[0], product: { ...cart[0].product, price: 1 } }];
      await expect(
        new OrderService('EUR').createOrder(tampered, { cashAmount: 3, cardAmount: null })
      ).rejects.toThrow(ValidationError);
    });

    it.each([
      ['a zero total, cash', 0, { cashAmount: 0, cardAmount: null }, [0, null]],
      ['a negative total, card', -100, { cashAmount: null, cardAmount: -100 }, [null, -100]],
    ])('stores a single mode for %s (D-032)', async (_label, price, payment, expected) => {
      mockGet.mockResolvedValue({ name: 'Retour Eco-cup', price, category_name: 'Consigne' });
      const refundCart = [
        { product: { id: 2, name: 'Retour Eco-cup', price, categoryId: 1 }, quantity: 1, discountedAmount: 0 },
      ];
      await new OrderService('EUR').createOrder(refundCart, payment);
      expect(insertedPayment()).toEqual(expected);
    });

    it('rejects two modes for a negative total (D-032)', async () => {
      mockGet.mockResolvedValue({ name: 'Retour Eco-cup', price: -100, category_name: 'Consigne' });
      const refundCart = [
        { product: { id: 2, name: 'Retour Eco-cup', price: -100, categoryId: 1 }, quantity: 1, discountedAmount: 0 },
      ];
      await expect(
        new OrderService('EUR').createOrder(refundCart, { cashAmount: -50, cardAmount: -50 })
      ).rejects.toThrow(ValidationError);
    });

    it('refuses an order without payment on an EUR instance, asking to reload (D-035)', async () => {
      // Bare-array body of clients before 1.3.0: no payment at all.
      await expect(new OrderService('EUR').createOrder(cart, undefined)).rejects.toMatchObject({
        code: 'PAYMENT_REQUIRED',
        message: expect.stringContaining('Reload the page'),
      });
      expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
    });

    it('still accepts an order without payment on a token instance (D-035)', async () => {
      await new OrderService('TOKEN').createOrder(cart, undefined);
      expect(insertedPayment()).toEqual([null, null]);
    });

    it('records no payment on a token instance (D-033)', async () => {
      await new OrderService('TOKEN').createOrder(cart, null);
      expect(insertedPayment()).toEqual([null, null]);
    });

    it('refuses a payment on a token instance (D-033)', async () => {
      await expect(
        new OrderService('TOKEN').createOrder(cart, { cashAmount: 750, cardAmount: null })
      ).rejects.toThrow('Payments are not recorded on token instances');
    });
  });
});
