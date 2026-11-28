import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import type { AuthResponseType, TooManyAttemptsResponseType } from 'shared-ts';
import {
  AuthService,
  InvalidCredentialsError,
  TooManyAttemptsError,
} from '../services/auth.service';
import {
  clearSessionCookie,
  CookieOptions,
  getAuthUser,
  readSessionToken,
  setSessionCookie,
} from '../middleware/auth';

/**
 * Login and logout (D-063). Mounted on /api/auth before requireAuth:
 * - POST /auth/login  : public. { username, password } -> { user } + session cookie;
 *                       401 INVALID_CREDENTIALS, 429 TOO_MANY_ATTEMPTS (+ Retry-After).
 * - POST /auth/logout : closes the session and clears the cookie (204).
 * - GET  /auth/me     : the logged-in user, read again from the database.
 * logout and me go through `protect` (requireAuth). The body of these routes is never logged.
 */
export class AuthController {
  public path = '/auth';
  public router = Router();

  constructor(
    private readonly authService: AuthService,
    private readonly cookieOptions: CookieOptions,
    protect: RequestHandler
  ) {
    this.router.post('/login', this.login);
    this.router.post('/logout', protect, this.logout);
    this.router.get('/me', protect, this.me);
  }

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { username, password } = (req.body ?? {}) as { username?: unknown; password?: unknown };
    try {
      const { user, token } = await this.authService.login(username, password, req.ip);
      setSessionCookie(res, token, this.cookieOptions);
      const body: AuthResponseType = { user };
      res.json(body);
    } catch (error) {
      if (error instanceof TooManyAttemptsError) {
        req.log.warn('Login refused: too many failed attempts');
        const body: TooManyAttemptsResponseType = {
          error: error.message,
          code: error.code,
          retryAfterSeconds: error.retryAfterSeconds,
        };
        res.setHeader('Retry-After', String(error.retryAfterSeconds));
        res.status(429).json(body);
      } else if (error instanceof InvalidCredentialsError) {
        req.log.info('Login refused: invalid credentials');
        res.status(401).json({ error: error.message, code: error.code });
      } else {
        next(error);
      }
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logout(readSessionToken(req));
      clearSessionCookie(res, this.cookieOptions);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public me = (req: Request, res: Response): void => {
    const user = getAuthUser(res);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }
    const body: AuthResponseType = { user };
    res.json(body);
  };
}
