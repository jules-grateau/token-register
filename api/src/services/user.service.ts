import type { Database } from 'sqlite';
import type {
  CreateUserRequestType,
  UpdateUserRequestType,
  UserAccountType,
  UserRole,
} from 'shared-ts';
import { openDb } from '../db';
import { ROLES } from '../db/auth';
import { rollbackQuietly } from '../db/cashDays';
import { hashPassword, validatePassword } from '../utils/password';
import { normalizeUsername, validateUsername } from '../utils/username';
import { ConflictError, NotFoundError, ValidationError } from '../types/errors';

/** Answer 8 a of D-064: the exact message of the API. */
export const LAST_ACTIVE_ADMIN_MESSAGE = 'Il doit rester au moins un administrateur actif';

interface AccountRow {
  id: number;
  username: string;
  role: string;
  active: number;
  must_change_password: number;
}

const ACCOUNT_COLUMNS = 'id, username, role, active, must_change_password';

const toAccount = (row: AccountRow): UserAccountType => ({
  id: row.id,
  username: row.username,
  role: row.role as UserRole,
  active: row.active === 1,
  mustChangePassword: row.must_change_password === 1,
});

const isRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value);

function checkPassword(password: unknown): string {
  const error = validatePassword(password);
  if (error) throw new ValidationError(error, 'PASSWORD_INVALID');
  return password as string;
}

/**
 * Runs `work` inside BEGIN IMMEDIATE: the guards (own account, last active admin) read and
 * write under the same write lock, so two admins acting at once never leave zero active admin.
 */
async function inWriteTransaction<T>(work: (db: Database) => Promise<T>): Promise<T> {
  const db = await openDb();
  try {
    await db.exec('BEGIN IMMEDIATE');
    try {
      const result = await work(db);
      await db.exec('COMMIT');
      return result;
    } catch (error) {
      await rollbackQuietly(db);
      throw error;
    }
  } finally {
    await db.close();
  }
}

async function getAccountRow(db: Database, id: number): Promise<AccountRow> {
  const row = await db.get<AccountRow>(`SELECT ${ACCOUNT_COLUMNS} FROM users WHERE id = ?`, [id]);
  if (!row) throw new NotFoundError('Account not found.');
  return row;
}

/**
 * Account management (D-063 points 9 to 12, D-064), admin only (permission "users"). Accounts
 * are never deleted: deactivation only. A deactivation or a reset closes the account's sessions
 * at once; the permissions are read again on every request, so a new role applies at once.
 */
export class UserService {
  /** Answer 7 a: active accounts first, then by username, case ignored. */
  async list(): Promise<UserAccountType[]> {
    const db = await openDb();
    try {
      const rows = await db.all<AccountRow[]>(
        `SELECT ${ACCOUNT_COLUMNS} FROM users ORDER BY active DESC, username COLLATE NOCASE, id`
      );
      return rows.map(toAccount);
    } finally {
      await db.close();
    }
  }

  /**
   * Answer 3 a: the password typed by the admin is temporary (must_change_password = 1).
   * Same rules as the first admin: username normalized and checked, unique without case (409).
   */
  async create(
    input: Partial<Record<keyof CreateUserRequestType, unknown>>
  ): Promise<UserAccountType> {
    const username = normalizeUsername(input.username);
    const usernameError = validateUsername(username);
    if (usernameError) throw new ValidationError(usernameError, 'USERNAME_INVALID');
    const password = checkPassword(input.password);
    if (!isRole(input.role)) throw new ValidationError('Unknown role.', 'ROLE_INVALID');
    const role = input.role;
    const hash = await hashPassword(password);

    return inWriteTransaction(async (db) => {
      const taken = await db.get<{ id: number }>('SELECT id FROM users WHERE username = ?', [
        username,
      ]);
      if (taken) throw new ConflictError('This username is already taken.', 'USERNAME_TAKEN');
      const now = Date.now();
      const { lastID } = await db.run(
        `INSERT INTO users (username, password_hash, role, active, must_change_password,
           created_at, updated_at)
         VALUES (?, ?, ?, 1, 1, ?, ?)`,
        [username, hash, role, now, now]
      );
      if (!lastID) throw new Error('Failed to create the user account.');
      return toAccount(await getAccountRow(db, lastID));
    });
  }

  /**
   * Role and / or state. Checks, in this order: own account (SELF_ACCOUNT_CHANGE, D-063 point
   * 12), then last active admin (LAST_ACTIVE_ADMIN, answer 8 a). A deactivation closes every
   * session of the account (answer 6 a); a reactivation keeps its password.
   */
  async update(
    actorId: number,
    id: number,
    input: Partial<Record<keyof UpdateUserRequestType, unknown>>
  ): Promise<UserAccountType> {
    const hasRole = input.role !== undefined;
    const hasActive = input.active !== undefined;
    if (!hasRole && !hasActive) throw new ValidationError('Nothing to change.');
    if (hasRole && !isRole(input.role)) throw new ValidationError('Unknown role.', 'ROLE_INVALID');
    if (hasActive && typeof input.active !== 'boolean') {
      throw new ValidationError('"active" must be true or false.');
    }

    return inWriteTransaction(async (db) => {
      const row = await getAccountRow(db, id);
      const role = hasRole ? (input.role as UserRole) : (row.role as UserRole);
      const active = hasActive ? (input.active as boolean) : row.active === 1;
      const roleChanges = role !== row.role;
      const deactivates = row.active === 1 && !active;
      if (!roleChanges && active === (row.active === 1)) return toAccount(row);

      if (id === actorId && (roleChanges || deactivates)) {
        throw new ConflictError(
          'You cannot deactivate nor change the role of your own account.',
          'SELF_ACCOUNT_CHANGE'
        );
      }
      const losesAdmin = row.role === 'admin' && row.active === 1 && (role !== 'admin' || !active);
      if (losesAdmin) {
        const others = await db.get<{ n: number }>(
          "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1 AND id <> ?",
          [id]
        );
        if ((others?.n ?? 0) === 0) {
          throw new ConflictError(LAST_ACTIVE_ADMIN_MESSAGE, 'LAST_ACTIVE_ADMIN');
        }
      }
      await db.run('UPDATE users SET role = ?, active = ?, updated_at = ? WHERE id = ?', [
        role,
        active ? 1 : 0,
        Date.now(),
        id,
      ]);
      if (deactivates) await db.run('DELETE FROM sessions WHERE user_id = ?', [id]);
      return toAccount(await getAccountRow(db, id));
    });
  }

  /**
   * Reset by the admin (D-063 point 10, answer 2 a): the admin types the temporary password,
   * which is never shown again; must_change_password = 1 and every session is closed. Refused
   * on one's own account (answer 12 a) and on a disabled account (answer 13 b).
   */
  async resetPassword(actorId: number, id: number, password: unknown): Promise<UserAccountType> {
    const valid = checkPassword(password);
    if (id === actorId) {
      throw new ConflictError(
        'Change your own password from the settings menu.',
        'SELF_PASSWORD_RESET'
      );
    }
    const hash = await hashPassword(valid);
    return inWriteTransaction(async (db) => {
      const row = await getAccountRow(db, id);
      if (row.active !== 1) {
        throw new ConflictError(
          'This account is disabled: reactivate it first.',
          'ACCOUNT_DISABLED'
        );
      }
      await db.run(
        'UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = ? WHERE id = ?',
        [hash, Date.now(), id]
      );
      await db.run('DELETE FROM sessions WHERE user_id = ?', [id]);
      return toAccount(await getAccountRow(db, id));
    });
  }
}
