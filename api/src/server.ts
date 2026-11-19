import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { basicAuthMiddleware } from './middleware/basicAuth';
import { pinoHttp } from 'pino-http';
import logger from './utils/logger';
import path from 'path';
import { CategoryController, ProductController, OrderController } from './controllers';
import { AppError, ValidationError, NotFoundError } from './types/errors';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { getConfiguredCurrency } from './utils/currency';
import { openDb } from './db';
import { verifyInstanceCurrency } from './db/currency';

dotenv.config();
const API_ROUTE = '/api';
// D-008: instance currency, fixed by configuration. Throws on an invalid value.
const CURRENCY = getConfiguredCurrency();
const app = express();

app.use(pinoHttp({ logger }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(basicAuthMiddleware);

const categoryController = new CategoryController(new CategoryService(), new ProductService());
const productController = new ProductController(new ProductService());
const orderController = new OrderController(new OrderService());

app.use(API_ROUTE + categoryController.path, categoryController.router);
app.use(API_ROUTE + productController.path, productController.router);
app.use(API_ROUTE + orderController.path, orderController.router);

// --- Static file serving and config for production ---
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../../client/dist');
  const runtimeClientApiUrl = process.env.RUNTIME_VITE_BASE_API_URL || 'http://localhost:3001';
  const runtimeClientDefaultLang = process.env.RUNTIME_VITE_DEFAULT_LANGUAGE || 'fr';

  logger.info(`Serving static files from: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));

  app.get('/config.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
      window.APP_CONFIG = {
        VITE_BASE_API_URL: "${runtimeClientApiUrl}",
        VITE_DEFAULT_LANGUAGE: "${runtimeClientDefaultLang}",
        VITE_CURRENCY: "${CURRENCY}"
      };
    `);
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running in development mode. React client served separately by Vite.');
  });
}

// Express identifies error handlers by their 4-argument signature: `next` must be declared.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error(err, 'Unhandled error or error passed by next()');

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof AppError) {
    res.status(500).json({ error: err.message || 'An application error occurred' });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
  });
});

async function start(): Promise<void> {
  // D-009: never serve amounts if the configured currency differs from the database one.
  const db = await openDb();
  try {
    await verifyInstanceCurrency(db, CURRENCY);
  } finally {
    await db.close();
  }

  app.listen(process.env.PORT, () => {
    logger.info(`Server is running on port ${process.env.PORT}`);
    logger.info(`Instance currency: ${CURRENCY}`);
    logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
    if (!process.env.BASIC_AUTH_USER || !process.env.BASIC_AUTH_PASS) {
      logger.warn('WARNING: Basic Auth credentials are not set. Authentication will fail.');
    }
  });
}

start().catch((error: unknown) => {
  // console as well: the pino transport may not flush before process.exit.
  console.error('Server startup aborted:', error instanceof Error ? error.message : error);
  logger.fatal(error, 'Server startup aborted');
  process.exit(1);
});
