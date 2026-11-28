import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ConflictError, NotFoundError, ValidationError } from '../types/errors';
import { getAuthUserId, requirePermission } from '../middleware/auth';

/** Route ids are positive integers only ("12", not "12abc" or "-1"). */
const parseId = (value: unknown): number | null => {
  if (typeof value !== 'string' || !/^\d{1,15}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
};

type Body = Record<string, unknown>;
const bodyOf = (req: Request): Body =>
  req.body && typeof req.body === 'object' ? (req.body as Body) : {};

/**
 * Accounts (D-063 points 9 to 12, D-064), permission "users" (admin only). The bodies of these
 * routes hold passwords: they are never logged, and no answer holds a password nor a hash.
 * - GET   /users                    : UserAccountType[] (active first, then by username)
 * - POST  /users                    : { username, password, role } -> 201 (temporary password)
 * - PATCH /users/:id                : { role?, active? } (409 SELF_ACCOUNT_CHANGE, LAST_ACTIVE_ADMIN)
 * - POST  /users/:id/reset-password : { password } (409 SELF_PASSWORD_RESET, ACCOUNT_DISABLED)
 */
export class UserController {
  public path = '/users';
  public router = Router();

  constructor(private readonly userService: UserService) {
    this.router.use(requirePermission('users'));
    this.router.get('/', this.list);
    this.router.post('/', this.create);
    this.router.patch('/:id', this.update);
    this.router.post('/:id/reset-password', this.resetPassword);
  }

  private handleError(error: unknown, req: Request, res: Response, next: NextFunction) {
    if (error instanceof ConflictError) {
      req.log.info(`Account change refused: ${error.code ?? 'conflict'}`);
      res.status(409).json({ error: error.message, ...(error.code ? { code: error.code } : {}) });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message, ...(error.code ? { code: error.code } : {}) });
    } else {
      next(error);
    }
  }

  /** The id of the route, or a 400 answer (null). */
  private routeId(req: Request, res: Response): number | null {
    const id = parseId(req.params.id);
    if (id === null) res.status(400).json({ error: 'Invalid account ID format' });
    return id;
  }

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.userService.list());
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { username, password, role } = bodyOf(req);
    try {
      const account = await this.userService.create({ username, password, role });
      req.log.info({ accountId: account.id }, 'Account created');
      res.status(201).json(account);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = this.routeId(req, res);
    if (id === null) return;
    const { role, active } = bodyOf(req);
    try {
      const account = await this.userService.update(getAuthUserId(res) ?? 0, id, { role, active });
      req.log.info({ accountId: id }, 'Account updated');
      res.json(account);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = this.routeId(req, res);
    if (id === null) return;
    try {
      const account = await this.userService.resetPassword(
        getAuthUserId(res) ?? 0,
        id,
        bodyOf(req).password
      );
      req.log.info({ accountId: id }, 'Account password reset');
      res.json(account);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  };
}
