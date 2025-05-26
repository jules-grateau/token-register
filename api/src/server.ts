import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { basicAuthMiddleware } from './middleware/basicAuth';
import { pinoHttp } from 'pino-http';
import logger from './utils/logger';
import path from 'path';
import { CategoryController, ProductController, OrderController } from './controllers';
import { AppError, ValidationError, NotFoundError } from './types/errors';

dotenv.config();

const app = express();

app.use(pinoHttp({ logger }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json()); 
app.use(basicAuthMiddleware); 

const categoryController = new CategoryController();
const productController = new ProductController();
const orderController = new OrderController();

app.use(categoryController.path, categoryController.router);
app.use(productController.path, productController.router);
app.use(orderController.path, orderController.router);


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
        VITE_DEFAULT_LANGUAGE: "${runtimeClientDefaultLang}"
      };
    `);
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running in development mode. React client served separately by Vite.');
  });
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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


app.listen(process.env.PORT, () => {
  logger.info(`Server is running on port ${process.env.PORT}`);
  logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
  if (!process.env.BASIC_AUTH_USER || !process.env.BASIC_AUTH_PASS) {
    logger.warn('WARNING: Basic Auth credentials are not set. Authentication will fail.');
  }
});