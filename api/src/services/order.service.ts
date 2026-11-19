import { openDb } from '../db';
import logger from '../utils/logger';
import { CartItemType, OrderType, OrderItemType, PaginationParams, PaginatedOrdersResponse } from 'shared-ts';
import { NotFoundError, ValidationError } from '../types/errors';
import { isValidStoredAmount } from '../utils/currency';

interface OrderItemDbRow {
  order_id: number;
  date: number;
  product_id: number | null;
  product_name: string;
  product_price: number;
  category_name: string;
  quantity: number;
  discountedAmount: number;
}

export class OrderService {
  async getAllOrders(params?: PaginationParams): Promise<PaginatedOrdersResponse> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    if (page < 1) {
      throw new ValidationError('Page number must be >= 1');
    }

    if (pageSize < 1 || pageSize > 100) {
      throw new ValidationError('Page size must be between 1 and 100');
    }

    const offset = (page - 1) * pageSize;

    let db;
    try {
      db = await openDb();

      const countResult = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM orders');
      const totalCount = countResult?.count ?? 0;

      const totalPages = Math.ceil(totalCount / pageSize);

      const rows = await db.all<OrderItemDbRow[]>(`
            SELECT
              orders.id as order_id,
              orders.date,
              order_items.product_id,
              order_items.product_name,
              order_items.product_price,
              order_items.category_name,
              order_items.quantity,
              order_items.discountedAmount
            FROM orders
            LEFT JOIN order_items ON orders.id = order_items.order_id
            WHERE orders.id IN (
              SELECT id FROM orders
              ORDER BY date DESC
              LIMIT ? OFFSET ?
            )
            ORDER BY orders.date DESC;`, [pageSize, offset]);

      const orders = new Map<number, OrderType>();

      for (const row of rows) {
        const { order_id, date, product_id, product_name, product_price, category_name, quantity, discountedAmount } = row;

        if (!orders.has(order_id)) {
          orders.set(order_id, { id: order_id, date, items: [] });
        }

        const order = orders.get(order_id);

        if (order) {
          const orderItem: OrderItemType = {
            productId: product_id,
            productName: product_name,
            productPrice: product_price,
            categoryName: category_name,
            quantity,
            discountedAmount,
          };
          order.items.push(orderItem);
        }
      }

      const result: PaginatedOrdersResponse = {
        data: Array.from(orders.values()),
        pagination: {
          currentPage: page,
          pageSize,
          totalCount,
          totalPages,
        },
      };

      logger.info({ page, pageSize, totalCount, totalPages }, 'Fetched paginated orders');
      return result;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Error fetching orders: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }

  async createOrder(cartItems: CartItemType[]): Promise<{ id: number }> {
    if (!cartItems || cartItems.length === 0) {
      throw new ValidationError('No items in the cart');
    }

    const hasInvalidQuantity = cartItems.some(
      (cartItem) => !Number.isInteger(cartItem.quantity) || cartItem.quantity < 1
    );

    if (hasInvalidQuantity) {
      throw new ValidationError('Invalid product quantity');
    }

    let db;
    try {
      db = await openDb();
      await db.exec('BEGIN TRANSACTION');

      // Snapshot name/price/category from the database, never from the request body:
      // the client could otherwise send arbitrary prices.
      const snapshots = [];
      for (const { product, quantity, discountedAmount } of cartItems) {
        const productId = product?.id;
        const row = await db.get<{ name: string; price: number; category_name: string | null }>(
          `SELECT p.name, p.price, c.name AS category_name
           FROM products p
           LEFT JOIN categories c ON c.id = p.category_id
           WHERE p.id = ?`,
          [productId]
        );

        if (!row) {
          throw new ValidationError(`Product with ID ${String(productId)} not found`);
        }

        // Math.max: negative-priced products (e.g. eco-cup return) cannot be discounted.
        const maxDiscount = Math.max(0, row.price * quantity);
        if (
          !isValidStoredAmount(discountedAmount) ||
          discountedAmount < 0 ||
          discountedAmount > maxDiscount
        ) {
          throw new ValidationError('Invalid discount amount');
        }

        if (!row.category_name) {
          logger.warn({ productId }, 'Category not found for product, using fallback name');
        }

        snapshots.push({
          productId,
          productName: row.name,
          productPrice: row.price,
          categoryName: row.category_name ?? 'Unknown Category',
          quantity,
          discountedAmount,
        });
      }

      const orderResult = await db.run('INSERT INTO orders (date) VALUES (?)', [Date.now()]);
      const orderId = orderResult.lastID;

      if (!orderId) {
        throw new Error('Failed to create order record.');
      }

      for (const snapshot of snapshots) {
        const { productId, productName, productPrice, categoryName, quantity, discountedAmount } =
          snapshot;

        logger.info(
          { orderId, productId, productName, productPrice, categoryName, quantity, discountedAmount },
          'Creating order item with product snapshot'
        );

        await db.run(
          `INSERT INTO order_items
          (order_id, product_id, quantity, discountedAmount, product_name, product_price, category_name)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, productId, quantity, discountedAmount, productName, productPrice, categoryName]
        );
      }

      await db.exec('COMMIT');
      logger.info('New order created with ID: %s with product snapshots', orderId);
      return { id: orderId };
    } catch (error) {
      if (db) await db.exec('ROLLBACK');
      if (error instanceof ValidationError) throw error;
      throw new Error(`Error creating new order in service: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }

  async deleteOrder(orderId: number): Promise<void> {
    let db;
    try {
      db = await openDb();
      await db.exec('BEGIN TRANSACTION');
      await db.run('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      const orderChanges = await db.run('DELETE FROM orders WHERE id = ?', [orderId]);
      await db.exec('COMMIT');

      if (orderChanges.changes === 0) {
        throw new NotFoundError(`Order with ID ${orderId} not found`);
      }

      logger.info('Order deleted with ID: %s', orderId);
    } catch (error) {
      if (db) await db.exec('ROLLBACK');
      if (error instanceof NotFoundError) throw error;
      throw new Error(`Error delete order in service: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }
}
