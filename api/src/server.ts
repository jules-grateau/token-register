import express, { Request, Response } from 'express';
import { openDb } from './db';
import { Product, CartItem, Order } from 'shared-ts';
import cors from 'cors';

// Create the Express app
const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); // Allow requests from the React app
app.use(express.json()); // Parse JSON request bodies

// Define a GET route at "/"
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World from Express + TypeScript!');
});

app.get("/products", async (req: Request, res: Response) => {
  // Return all products fromt the database
  const db = await openDb();
  const products = await db.all<Product>("SELECT * FROM products");
  res.json(products);
  db.close();
});

app.get("/orders", async (req: Request, res: Response) => {
  // Return all orders from the database
  const db = await openDb();
  const rows = await db.all("SELECT order_id, product_id, date, quantity, name, price FROM orders LEFT JOIN order_items ON orders.id = order_items.order_id LEFT JOIN products on order_items.product_id = products.id"); 
  // Join with order_items to get the product details
  const orders = new Map<number, Order>();

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
  const cartItems : CartItem[] = req.body; // Extract cartItems from the request body

  if (!cartItems || cartItems.length === 0) {
    res.status(400).json({ error: "No items in the cart" });
    db.close();
    return;
  }
  
  // Insert the order into the orders table
  const order = await db.run("INSERT INTO orders (date) VALUES (?)", [Date.now()]);
  const orderId = order.lastID;

  for (const item of cartItems) {
    const { product, quantity } = item;
    const { id } = product;

    // Insert the order items into the order_items table
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
  
  // Delete the order items from the order_items table
  await db.run("DELETE FROM order_items WHERE order_id = ?", [orderId]);
  // Delete the order from the orders table
  await db.run("DELETE FROM orders WHERE id = ?", [orderId]);
  res.status(204).send();
  db.close();
});

// Start the server on port 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});