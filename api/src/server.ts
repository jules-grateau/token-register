import express, { Request, Response } from 'express';
import { openDb } from './db';
import { ProductType, CartItemType, OrderType } from 'shared-ts';
import cors from 'cors';
import dotenv from 'dotenv';
import { basicAuthMiddleware } from './middleware/basicAuth';

dotenv.config();

const app = express();

console.log(process.env.FRONTEND_URL);
app.use(cors({ 
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(basicAuthMiddleware);

app.use(express.json());


app.get('/categories', async (req: Request, res: Response) => {
  const db = await openDb();
  const categories = await db.all("SELECT * FROM categories");
  res.json(categories);
  db.close();
});

app.get("/products", async (req: Request, res: Response) => {
  const db = await openDb();
  const products = await db.all<ProductType>("SELECT * FROM products");
  res.json(products);
  db.close();
});

app.get("/categories/:categoryId/products", async (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.categoryId, 10);
  if (isNaN(categoryId)) {
    res.status(400).json({ error: "Invalid category ID" });
    return;
  }

  const db = await openDb();
  const products = await db.all<ProductType[]>("SELECT * FROM products WHERE category_id = ?", [categoryId]);
  res.json(products);
  db.close();
});

app.get("/orders", async (req: Request, res: Response) => {
  const db = await openDb();
  const rows = await db.all("SELECT order_id, product_id, date, quantity, name, price FROM orders LEFT JOIN order_items ON orders.id = order_items.order_id LEFT JOIN products on order_items.product_id = products.id ORDER BY date DESC;"); 
  const orders = new Map<number, OrderType>();

  for (const row of rows) {
    const { order_id, date, name, product_id, price, quantity } = row;
    if (!orders.has(order_id)) {
      orders.set(order_id, { id: order_id, date, items: [] });
    }
    const order = orders.get(order_id);
    if (order) {
      order.items.push({ product: { id: product_id, name, price }, quantity });
    }
  }

  res.json(Array.from(orders.values()));
  db.close();
});

app.post("/orders", async (req: Request, res: Response) => {
  const db = await openDb();
  const cartItems : CartItemType[] = req.body; // Extract cartItems from the request body

  if (!cartItems || cartItems.length === 0) {
    res.status(400).json({ error: "No items in the cart" });
    db.close();
    return;
  }
  
  const order = await db.run("INSERT INTO orders (date) VALUES (?)", [Date.now()]);
  const orderId = order.lastID;

  for (const item of cartItems) {
    const { product, quantity } = item;
    const { id } = product;

    await db.run("INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)", [orderId, id, quantity]);
  };

  res.status(201).json({ id: orderId });
  db.close();
});

app.delete("/orders/:id", async (req: Request, res: Response) => {
  const db = await openDb();
  const orderId = parseInt(req.params.id, 10);
  if (isNaN(orderId)) {
    res.status(400).json({ error: "Invalid order ID" });
    db.close();
    return;
  }
  
  await db.run("DELETE FROM order_items WHERE order_id = ?", [orderId]);
  await db.run("DELETE FROM orders WHERE id = ?", [orderId]);
  res.status(204).send();
  db.close();
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  if (!process.env.BASIC_AUTH_USER || !process.env.BASIC_AUTH_PASS) {
    console.warn('WARNING: Basic Auth credentials are not set. Authentication will fail.');
  }
});