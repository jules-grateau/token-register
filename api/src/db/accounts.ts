import type { Database } from 'sqlite';
import type { UserRole } from 'shared-ts';
import { countUsers, usersTableExists } from './auth';
import { rollbackQuietly } from './cashDays';
import { hashPassword, validatePassword } from '../utils/password';
import { normalizeUsername, validateUsername } from '../utils/username';

/** Message when the account tables are missing: the migration has not run. */
export const MIGRATION_REQUIRED =
  'No user account table in the database. Run the database migration first (db:migrate).';

export const RESET_ADMIN_COMMAND =
  'RESET_ADMIN_PASSWORD=<new password> npm run prod:db:reset-admin-password -- <username>';

/** A configuration or command input that breaks the account rules: nothing is written. */
export class AccountConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountConfigError';
  }
}

/** Validated username and password, or an AccountConfigError naming the variables. */
function readCredentials(
  rawUsername: unknown,
  password: unknown,
  names: { username: string; password: string }
): { username: string; password: string } {
  const username = normalizeUsername(rawUsername);
  const missing = [
    ...(username ? [] : [names.username]),
    ...(typeof password === 'string' && password !== '' ? [] : [names.password]),
  ];
  if (missing.length > 0) {
    throw new AccountConfigError(`Missing ${missing.join(' and ')}.`);
  }
  const usernameError = validateUsername(username);
  if (usernameError) throw new AccountConfigError(`${names.username}: ${usernameError}`);
  const passwordError = validatePassword(password);
  if (passwordError) throw new AccountConfigError(`${names.password}: ${passwordError}`);
  return { username, password: password as string };
}

async function insertUser(
  db: Database,
  username: string,
  passwordHash: string,
  role: UserRole
): Promise<number> {
  const now = Date.now();
  const { lastID } = await db.run(
    `INSERT INTO users (username, password_hash, role, active, must_change_password, created_at,
       updated_at)
     VALUES (?, ?, ?, 1, 0, ?, ?)`,
    [username, passwordHash, role, now, now]
  );
  if (!lastID) throw new Error('Failed to create the user account.');
  return lastID;
}

export type InitialAdminResult = { created: false } | { created: true; username: string };

/**
 * First admin (D-063, point 2, answers 3 a and 10 a): when the users table is empty, whether the
 * database holds data or not, INITIAL_ADMIN_USERNAME / INITIAL_ADMIN_PASSWORD create an admin.
 * Missing or invalid: throws a message naming the variable, and the start is refused (D-009).
 * Once an account exists, both variables are ignored.
 */
export async function ensureInitialAdmin(
  db: Database,
  env: NodeJS.ProcessEnv = process.env
): Promise<InitialAdminResult> {
  if (!(await usersTableExists(db))) throw new Error(MIGRATION_REQUIRED);
  if ((await countUsers(db)) > 0) return { created: false };

  let credentials;
  try {
    credentials = readCredentials(env.INITIAL_ADMIN_USERNAME, env.INITIAL_ADMIN_PASSWORD, {
      username: 'INITIAL_ADMIN_USERNAME',
      password: 'INITIAL_ADMIN_PASSWORD',
    });
  } catch (error) {
    throw new AccountConfigError(
      `No user account yet: the first admin is created from INITIAL_ADMIN_USERNAME and ` +
        `INITIAL_ADMIN_PASSWORD, read only while no account exists. ` +
        `${(error as Error).message} The application refuses to start (see deploy/README.md).`
    );
  }
  const hash = await hashPassword(credentials.password);
  await db.exec('BEGIN IMMEDIATE');
  try {
    // Checked again inside the lock: two starts at once create a single admin.
    if ((await countUsers(db)) > 0) {
      await db.exec('COMMIT');
      return { created: false };
    }
    await insertUser(db, credentials.username, hash, 'admin');
    await db.exec('COMMIT');
  } catch (error) {
    await rollbackQuietly(db);
    throw error;
  }
  return { created: true, username: credentials.username };
}

export type ResetAdminResult = { action: 'created' | 'updated'; closedSessions: number };

/**
 * `reset-admin-password <username>` (answer 4 a): the new password comes from the environment,
 * never from the command line. Existing account (any case): new password, reactivated, made
 * admin again, all its sessions closed. Unknown: a new admin. The password is not temporary
 * (must_change_password stays 0). Everything is validated before writing, in one transaction.
 */
export async function resetAdminPassword(
  db: Database,
  rawUsername: unknown,
  password: unknown
): Promise<ResetAdminResult> {
  if (!(await usersTableExists(db))) throw new Error(MIGRATION_REQUIRED);
  const credentials = readCredentials(rawUsername, password, {
    username: 'the <username> argument',
    password: 'RESET_ADMIN_PASSWORD',
  });
  const hash = await hashPassword(credentials.password);

  await db.exec('BEGIN IMMEDIATE');
  try {
    const existing = await db.get<{ id: number }>('SELECT id FROM users WHERE username = ?', [
      credentials.username,
    ]);
    let result: ResetAdminResult;
    if (existing) {
      await db.run(
        `UPDATE users SET password_hash = ?, role = 'admin', active = 1, must_change_password = 0,
           updated_at = ?
         WHERE id = ?`,
        [hash, Date.now(), existing.id]
      );
      const { changes } = await db.run('DELETE FROM sessions WHERE user_id = ?', [existing.id]);
      result = { action: 'updated', closedSessions: changes ?? 0 };
    } else {
      await insertUser(db, credentials.username, hash, 'admin');
      result = { action: 'created', closedSessions: 0 };
    }
    await db.exec('COMMIT');
    return result;
  } catch (error) {
    await rollbackQuietly(db);
    throw error;
  }
}
