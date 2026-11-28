import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AuthUserType, Permission } from 'shared-ts';
import { AuthService, SESSION_IDLE_MS } from '../services/auth.service';

/** Name of the session cookie (httpOnly: never readable by the page's scripts). */
export const SESSION_COOKIE = 'cc_session';

export type CookieOptions = { secure: boolean };

const cookieAttributes = ({ secure }: CookieOptions) =>
  ({ httpOnly: true, sameSite: 'strict', secure, path: '/' }) as const;

/** Sets the session cookie (point 3). Sent again when the session is extended. */
export function setSessionCookie(res: Response, token: string, options: CookieOptions): void {
  res.cookie(SESSION_COOKIE, token, { ...cookieAttributes(options), maxAge: SESSION_IDLE_MS });
}

/** Clears it with the same attributes as when it was set, otherwise the browser keeps it. */
export function clearSessionCookie(res: Response, options: CookieOptions): void {
  res.clearCookie(SESSION_COOKIE, cookieAttributes(options));
}

/** Token of the session cookie, or null. No cookie-parser dependency for a single cookie. */
export function readSessionToken(req: Request): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === SESSION_COOKIE) {
      const value = part.slice(index + 1).trim();
      return value ? value : null;
    }
  }
  return null;
}

/** The user of the request, set by requireAuth. */
export function getAuthUser(res: Response): AuthUserType | undefined {
  return (res.locals as { user?: AuthUserType } | undefined)?.user;
}

/** Id of the user of the request, for the author columns (point 14). */
export function getAuthUserId(res: Response): number | null {
  return getAuthUser(res)?.id ?? null;
}

const unauthenticated = (res: Response) =>
  res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });

/**
 * D-064: with a temporary password, only these routes (method + exact path) are allowed; any
 * other one, present or future, answers 403 PASSWORD_CHANGE_REQUIRED (fails closed).
 */
export const PASSWORD_CHANGE_ALLOWED_ROUTES: ReadonlySet<string> = new Set([
  'GET /api/auth/me',
  'POST /api/auth/logout',
  'POST /api/auth/password',
]);

/**
 * Every /api route goes through here, except POST /api/auth/login: a future route is protected
 * by default. The session is read from the database on each request (point 15). A temporary
 * password (D-064) blocks everything but PASSWORD_CHANGE_ALLOWED_ROUTES, before any permission.
 */
export function requireAuth(authService: AuthService, options: CookieOptions): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = readSessionToken(req);
      const session = await authService.getSession(token);
      if (!session || !token) {
        unauthenticated(res);
        return;
      }
      res.locals.user = session.user;
      // Sliding expiry: the browser's copy lasts 7 days from the last use too.
      if (session.touched) setSessionCookie(res, token, options);
      if (
        session.user.mustChangePassword &&
        !PASSWORD_CHANGE_ALLOWED_ROUTES.has(`${req.method} ${req.baseUrl}${req.path}`)
      ) {
        res.status(403).json({
          error: 'Change your temporary password first.',
          code: 'PASSWORD_CHANGE_REQUIRED',
        });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Permission of a route (role -> permissions table). Fails closed: no user, unknown role or a
 * role without this permission gets 403.
 */
export function requirePermission(permission: Permission): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = getAuthUser(res);
    if (!user) {
      unauthenticated(res);
      return;
    }
    if (!user.permissions.includes(permission)) {
      res.status(403).json({ error: 'Not allowed for this account.', code: 'FORBIDDEN' });
      return;
    }
    next();
  };
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Answer 11 a: a write request whose Origin header is present and differs from FRONTEND_URL is
 * refused (403), on top of SameSite=Strict. No Origin header (curl, scripts): allowed, the
 * session cookie is still required.
 */
export function checkOrigin(allowedOrigin: string | null): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    if (!WRITE_METHODS.has(req.method) || origin === undefined) {
      next();
      return;
    }
    if (allowedOrigin === null || origin.replace(/\/+$/, '') !== allowedOrigin) {
      res.status(403).json({ error: 'Request refused: unknown origin.', code: 'ORIGIN_REFUSED' });
      return;
    }
    next();
  };
}
