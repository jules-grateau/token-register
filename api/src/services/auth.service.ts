import { createHash, randomBytes } from 'crypto';
import type { AuthUserType, Permission, UserRole } from 'shared-ts';
import { openDb } from '../db';
import { rollbackQuietly } from '../db/cashDays';
import {
  hashPassword,
  PASSWORD_MAX_LENGTH,
  validatePassword,
  verifyAgainstDummy,
  verifyPassword,
} from '../utils/password';
import { normalizeUsername, usernameKey } from '../utils/username';
import { IP_LIMITS, LoginRateLimiter, type LimiterState } from '../utils/loginRateLimiter';
import { AppError } from '../types/errors';
import logger from '../utils/logger';

/** Point 4 of D-063: a session ends after 7 days without any request. */
export const SESSION_IDLE_MS = 7 * 24 * 60 * 60 * 1000;
/** last_seen_at is written at most once an hour, not on every request (one SQLite write). */
export const SESSION_TOUCH_MS = 60 * 60 * 1000;

/** Wrong username or password, unknown or disabled account: one answer for all (answer 6 a). */
export class InvalidCredentialsError extends AppError {
  readonly code = 'INVALID_CREDENTIALS';
}

/** 5 failures for this username and IP: wait (point 7). */
export class TooManyAttemptsError extends AppError {
  readonly code = 'TOO_MANY_ATTEMPTS';
  constructor(public readonly retryAfterSeconds: number) {
    super('Too many failed attempts: try again in 1 minute.');
  }
}

/** POST /auth/password: the current password is wrong (D-064). Generic message. */
export class WrongPasswordError extends AppError {
  readonly code = 'WRONG_PASSWORD';
}

/** POST /auth/password: the new password breaks a rule (length, or same as the current one). */
export class NewPasswordError extends AppError {
  constructor(
    message: string,
    readonly code: 'PASSWORD_INVALID' | 'SAME_PASSWORD'
  ) {
    super(message);
  }
}

export type SessionLookup = {
  user: AuthUserType;
  /** True when last_seen_at was just moved forward: the cookie is sent again. */
  touched: boolean;
};

interface UserRow {
  id: number;
  username: string;
  role: string;
  must_change_password: number;
  permissions: string | null;
}

type SessionRow = UserRow & { last_seen_at: number };
type LoginRow = UserRow & { password_hash: string; active: number };

/** The cookie holds a random token; the database only its SHA-256 (a leaked copy logs no one). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const toUser = (row: UserRow): AuthUserType => ({
  id: row.id,
  username: row.username,
  role: row.role as UserRole,
  // Unknown role, or role without permissions: an empty list, every route answers 403.
  permissions: (row.permissions ? row.permissions.split(',') : []) as Permission[],
  mustChangePassword: row.must_change_password === 1,
});

/** The longer of two waits (or no wait). */
const longest = (a: LimiterState, b: LimiterState): LimiterState =>
  !a.blocked ? b : !b.blocked ? a : a.retryAfterSeconds >= b.retryAfterSeconds ? a : b;

const PERMISSIONS_SQL =
  '(SELECT group_concat(permission) FROM role_permissions WHERE role_permissions.role = users.role)';

export class AuthService {
  constructor(
    private readonly limiter: LoginRateLimiter = new LoginRateLimiter(),
    private readonly now: () => number = Date.now,
    private readonly ipLimiter: LoginRateLimiter = new LoginRateLimiter(Date.now, IP_LIMITS),
    // D-064: wrong current passwords, per account id and IP, apart from the login limiters (a
    // stolen session cannot guess the password; a failed change never blocks a login).
    private readonly passwordLimiter: LoginRateLimiter = new LoginRateLimiter()
  ) {}

  /**
   * Checks the credentials and opens a new session (a new token at each login). The same work
   * is done for an unknown or disabled account (dummy hash), so the time does not tell them
   * apart. `ip` is req.ip, which follows TRUST_PROXY_HOPS.
   */
  async login(
    rawUsername: unknown,
    password: unknown,
    ip: string | undefined
  ): Promise<{ user: AuthUserType; token: string }> {
    const key = LoginRateLimiter.key(usernameKey(rawUsername), ip);
    // Per username and IP (point 7), and per IP alone (TL-1 of PR #97): same answer.
    const ipKey = ip ?? '';
    const state = longest(this.limiter.check(key), this.ipLimiter.check(ipKey));
    if (state.blocked) throw new TooManyAttemptsError(state.retryAfterSeconds);

    const username = normalizeUsername(rawUsername);
    const pass = typeof password === 'string' ? password : '';
    const db = await openDb();
    try {
      const row = username
        ? await db.get<LoginRow>(
            `SELECT id, username, role, must_change_password, password_hash, active,
               ${PERMISSIONS_SQL} AS permissions
             FROM users WHERE username = ?`,
            [username]
          )
        : undefined;
      // Over PASSWORD_MAX_LENGTH: refused before scrypt, with the same answer (TL-2).
      const valid =
        pass.length > PASSWORD_MAX_LENGTH
          ? false
          : row && row.active === 1
            ? await verifyPassword(pass, row.password_hash)
            : await verifyAgainstDummy(pass);
      if (!row || !valid) {
        const after = longest(this.limiter.recordFailure(key), this.ipLimiter.recordFailure(ipKey));
        if (after.blocked) throw new TooManyAttemptsError(after.retryAfterSeconds);
        throw new InvalidCredentialsError('Invalid username or password.');
      }
      this.limiter.reset(key);

      const token = randomBytes(32).toString('base64url');
      const now = this.now();
      await db.run(
        'INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at) VALUES (?, ?, ?, ?)',
        [hashToken(token), row.id, now, now]
      );
      logger.info({ userId: row.id }, 'User logged in');
      return { user: toUser(row), token };
    } finally {
      await db.close();
    }
  }

  /**
   * The user of a session, read again from the database on every request (point 15: a new
   * role applies at once; a disabled account or a deleted session gets null at once).
   * Expired sessions get null too. One query: session + user + permissions.
   */
  async getSession(token: string | null): Promise<SessionLookup | null> {
    if (!token) return null;
    const now = this.now();
    const db = await openDb();
    try {
      const tokenHash = hashToken(token);
      const row = await db.get<SessionRow>(
        `SELECT users.id, users.username, users.role, users.must_change_password,
           sessions.last_seen_at, ${PERMISSIONS_SQL} AS permissions
         FROM sessions JOIN users ON users.id = sessions.user_id
         WHERE sessions.token_hash = ? AND users.active = 1 AND sessions.last_seen_at > ?`,
        [tokenHash, now - SESSION_IDLE_MS]
      );
      if (!row) return null;
      let touched = false;
      if (now - row.last_seen_at >= SESSION_TOUCH_MS) {
        await db.run('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?', [now, tokenHash]);
        touched = true;
      }
      return { user: toUser(row), touched };
    } finally {
      await db.close();
    }
  }

  /**
   * One's own password (D-063 point 9, D-064). Also the way out of a temporary password.
   * - The current password is checked first; wrong: WrongPasswordError, counted per account and
   *   IP (5 failures: TooManyAttemptsError, 1 minute). Over 256 characters: wrong, no scrypt.
   * - New password: 6 to 256 characters, different from the current one (answer 5 a).
   * - In one transaction: new hash, must_change_password = 0, and every other session of the
   *   account closed; the session in use is kept (answer 4 a).
   */
  async changePassword(
    userId: number,
    sessionToken: string,
    currentPassword: unknown,
    newPassword: unknown,
    ip: string | undefined
  ): Promise<AuthUserType> {
    const key = LoginRateLimiter.key(String(userId), ip);
    const state = this.passwordLimiter.check(key);
    if (state.blocked) throw new TooManyAttemptsError(state.retryAfterSeconds);

    const current = typeof currentPassword === 'string' ? currentPassword : '';
    const db = await openDb();
    try {
      const row = await db.get<{ password_hash: string }>(
        'SELECT password_hash FROM users WHERE id = ? AND active = 1',
        [userId]
      );
      const valid =
        !!row && current.length <= PASSWORD_MAX_LENGTH
          ? await verifyPassword(current, row.password_hash)
          : false;
      if (!valid || !row) {
        const after = this.passwordLimiter.recordFailure(key);
        if (after.blocked) throw new TooManyAttemptsError(after.retryAfterSeconds);
        throw new WrongPasswordError('The current password is wrong.');
      }
      this.passwordLimiter.reset(key);

      const newError = validatePassword(newPassword);
      if (newError) throw new NewPasswordError(newError, 'PASSWORD_INVALID');
      if (newPassword === current) {
        throw new NewPasswordError(
          'The new password must differ from the current one.',
          'SAME_PASSWORD'
        );
      }
      const hash = await hashPassword(newPassword as string);

      await db.exec('BEGIN IMMEDIATE');
      try {
        // Only if nothing moved since the check above (scrypt takes a while): an admin reset or a
        // deactivation in between wins, the old password must not overwrite it.
        const updated = await db.run(
          `UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ?
           WHERE id = ? AND active = 1 AND password_hash = ?`,
          [hash, this.now(), userId, row.password_hash]
        );
        if (!updated.changes) throw new WrongPasswordError('The current password is wrong.');
        await db.run('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?', [
          userId,
          hashToken(sessionToken),
        ]);
        const user = await db.get<UserRow>(
          `SELECT id, username, role, must_change_password, ${PERMISSIONS_SQL} AS permissions
           FROM users WHERE id = ?`,
          [userId]
        );
        await db.exec('COMMIT');
        if (!user) throw new Error('Account not found after the password change.');
        logger.info({ userId }, 'Password changed');
        return toUser(user);
      } catch (error) {
        await rollbackQuietly(db);
        throw error;
      }
    } finally {
      await db.close();
    }
  }

  /** Closes this session (logout). Unknown token: nothing to do. */
  async logout(token: string | null): Promise<void> {
    if (!token) return;
    const db = await openDb();
    try {
      await db.run('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
    } finally {
      await db.close();
    }
  }

  /** Deletes the expired sessions (at startup). Returns how many. */
  async purgeExpiredSessions(): Promise<number> {
    const db = await openDb();
    try {
      const { changes } = await db.run('DELETE FROM sessions WHERE last_seen_at <= ?', [
        this.now() - SESSION_IDLE_MS,
      ]);
      return changes ?? 0;
    } finally {
      await db.close();
    }
  }
}
