import express, { Request, Response } from 'express';
import { openDb } from './db';
import { Product } from 'shared-ts';
import cors from 'cors';

// Create the Express app
const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); // Allow requests from the React app

// Define a GET route at "/"
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World from Express + TypeScript!');
});

app.get("/products", async (req: Request, res: Response) => {
  // Return all products fromt the database
  const db = await openDb();
  const products = await db.all<Product>("SELECT * FROM products");
  res.json(products);
});

// Start the server on port 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});