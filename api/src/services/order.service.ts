import { openDb } from '../db';
import logger from '../utils/logger';
import { CartItemType, OrderType } from 'shared-ts';
import { NotFoundError, ValidationError } from '../types/errors';

interface OrderDbRow {
  order_id: number;
  date: number;
  name: string;
  product_id: number;
  category_id: number;
  price: number;
  quantity: number;
  discountedAmount: number;
}

export class OrderService {
  async getAllOrders(): Promise<OrderType[]> {
    let db;
    try {
      db = await openDb();
      const rows = await db.all<OrderDbRow[]>(`
            SELECT order_id, 
            product_id, 
            category_id,
            date, 
            quantity, 
            discountedAmount, 
            name, 
            price 
            FROM orders 
            LEFT JOIN order_items ON orders.id = order_items.order_id 
            LEFT JOIN products on order_items.product_id = products.id 
            ORDER BY date DESC;`);
      const orders = new Map<number, OrderType>();

      for (const row of rows) {
        const { order_id, date, name, product_id, category_id, price, quantity, discountedAmount } =
          row;
        if (!orders.has(order_id)) {
          orders.set(order_id, { id: order_id, date, items: [] });
        }

        const order = orders.get(order_id);

        if (order) {
          order.items.push({
            product: { id: product_id, name, price, categoryId: category_id },
            quantity,
            discountedAmount,
          });
        }
      }
      return Array.from(orders.values());
    } catch (error) {
      throw new Error(`Error fetching orders: ${String(error)}`);
    } finally {
      await db?.close();
    }
  }

  async createOrder(cartItems: CartItemType[]): Promise<{ id: number }> {
    if (!cartItems || cartItems.length === 0) {
      throw new ValidationError('No items in the cart');
    }

    const hasInvalidDiscount = cartItems.some((cartItem) => {
      const totalItemPrice = cartItem.product.price * cartItem.quantity;
      if (cartItem.discountedAmount === 0) return false;
      return cartItem.discountedAmount > totalItemPrice || cartItem.discountedAmount < 0;
    });

    if (hasInvalidDiscount) {
      throw new ValidationError('Invalid discount amount');
    }

    const hasInvalidQuantity = cartItems.some((cartItem) => cartItem.quantity < 1);

    if (hasInvalidQuantity) {
      throw new ValidationError('Invalid product quantity');
    }

    let db;
    try {
      db = await openDb();
      await db.exec('BEGIN TRANSACTION');

      const orderResult = await db.run('INSERT INTO orders (date) VALUES (?)', [Date.now()]);
      const orderId = orderResult.lastID;

      if (!orderId) {
        throw new Error('Failed to create order record.');
      }

      for (const item of cartItems) {
        const { product, quantity, discountedAmount } = item;
        const { id: productId } = product;
        logger.info(
          { orderId, productId, quantity, discountedAmount },
          'Inserting order item in service'
        );
        await db.run(
          'INSERT INTO order_items (order_id, product_id, quantity, discountedAmount) VALUES (?, ?, ?, ?)',
          [orderId, productId, quantity, discountedAmount]
        );
      }
      await db.exec('COMMIT');
      logger.info('New order created with ID: %s', orderId);
      return { id: orderId };
    } catch (error) {
      if (db) await db.exec('ROLLBACK');
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
