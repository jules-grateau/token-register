import express, { NextFunction, Request, Response, Router } from 'express';
import cors from 'cors';
import path from 'path';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { CurrencyCode } from 'shared-ts';
import {
  AuthController,
  CategoryController,
  ProductController,
  OrderController,
  CashDayController,
} from './controllers';
import { AppError, ValidationError, NotFoundError, ConflictError } from './types/errors';
import { AuthService } from './services/auth.service';
import { CashDayService } from './services/cashDay.service';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { buildRuntimeConfigScript } from './utils/runtimeConfig';
import { getAllowedOrigin, getTrustProxyHops, isSecureCookie } from './utils/authConfig';
import { checkOrigin, requireAuth } from './middleware/auth';
import defaultLogger from './utils/logger';

export const API_ROUTE = '/api';

/**
 * Never in the logs (D-063): the session cookie (request and response), any Authorization
 * header, and the raw body that the JSON parser attaches to its errors (a malformed login body
 * would otherwise be logged with its password). Request bodies are not logged by pino-http.
 */
export const LOG_REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  'err.body',
  'err.raw',
  'body',
  'password',
  '*.password',
];

export type AppConfig = {
  currency: CurrencyCode;
  clientName: string;
  env?: NodeJS.ProcessEnv;
  logger?: Logger;
  authService?: AuthService;
};

/** Business routers mounted under /api, all behind requireAuth (listed for the route tests). */
export function createApiControllers(): { path: string; router: Router }[] {
  return [
    new CategoryController(new CategoryService(), new ProductService()),
    new ProductController(new ProductService()),
    new OrderController(new OrderService()),
    new CashDayController(new CashDayService(), new OrderService()),
  ];
}

export function createApp({
  currency,
  clientName,
  env = process.env,
  logger = defaultLogger,
  authService = new AuthService(),
}: AppConfig) {
  const app = express();
  // Answer 12 a: req.ip (login limiter) trusts this many proxies, 0 by default.
  app.set('trust proxy', getTrustProxyHops(env));

  app.use(pinoHttp({ logger, redact: { paths: LOG_REDACT_PATHS, censor: '[redacted]' } }));
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      allowedHeaders: ['Content-Type'],
    })
  );
  app.use(express.json());

  // --- Public: static files and /config.js (production), before any authentication ---
  if (env.NODE_ENV === 'production') {
    const clientBuildPath = path.resolve(__dirname, '../../client/dist');
    const runtimeClientApiUrl = env.RUNTIME_VITE_BASE_API_URL || 'http://localhost:3001';
    const runtimeClientDefaultLang = env.RUNTIME_VITE_DEFAULT_LANGUAGE || 'fr';

    logger.info(`Serving static files from: ${clientBuildPath}`);
    app.use(express.static(clientBuildPath));

    app.get('/config.js', (req, res) => {
      res.type('application/javascript');
      res.send(
        buildRuntimeConfigScript({
          apiUrl: runtimeClientApiUrl,
          defaultLanguage: runtimeClientDefaultLang,
          currency,
          clientName,
        })
      );
    });
  } else {
    app.get('/', (req, res) => {
      res.send('API is running in development mode. React client served separately by Vite.');
    });
  }

  // --- /api: every route needs a session, except POST /api/auth/login (D-063) ---
  const cookieOptions = { secure: isSecureCookie(env) };
  const protect = requireAuth(authService, cookieOptions);
  app.use(API_ROUTE, checkOrigin(getAllowedOrigin(env)));
  const authController = new AuthController(authService, cookieOptions, protect);
  app.use(API_ROUTE + authController.path, authController.router);
  app.use(API_ROUTE, protect);
  for (const controller of createApiControllers()) {
    app.use(API_ROUTE + controller.path, controller.router);
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
    if (err instanceof ConflictError) {
      res.status(409).json({ error: err.message, code: err.code });
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

  return app;
}
