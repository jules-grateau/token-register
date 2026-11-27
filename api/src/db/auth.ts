import type { Database } from 'sqlite';
import type { Permission, UserRole } from 'shared-ts';

/**
 * User accounts, roles and sessions (3.0.0, D-063).
 * - roles / role_permissions: what each role may do. The rights are read from this table on
 *   every request (D-063, point 15), never from the role name in the code.
 * - users: username unique without case (`Marie` = `marie`), scrypt password hash, never
 *   deleted (deactivation only, point 11).
 * - sessions: the cookie token is stored hashed (SHA-256), with a sliding expiry
 *   (last_seen_at + 7 days, point 4). Deleting a row revokes the session at once.
 * - orders.created_by, cash_days.opened_by, cash_days.closed_by: author of each write (point
 *   14), nullable; rows written before 3.0.0 keep NULL (D-055).
 */

export const ROLES: readonly UserRole[] = ['admin', 'manager', 'cashier'];

/** Point 13: the three roles have everything that exists today; accounts are admin only. */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: ['sale', 'catalog', 'cash_day', 'order_delete', 'users'],
  manager: ['sale', 'catalog', 'cash_day', 'order_delete'],
  cashier: ['sale', 'catalog', 'cash_day', 'order_delete'],
};

const AUTH_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS roles (
    name TEXT PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS role_permissions (
    role TEXT NOT NULL REFERENCES roles (name),
    permission TEXT NOT NULL,
    PRIMARY KEY (role, permission)
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL REFERENCES roles (name),
    active INTEGER NOT NULL DEFAULT 1,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id),
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions (user_id);
`;

/** Author columns (point 14): [table, column]. Interpolated in ALTER TABLE: constants only. */
export const AUTHOR_COLUMNS = [
  ['orders', 'created_by'],
  ['cash_days', 'opened_by'],
  ['cash_days', 'closed_by'],
] as const;

async function columnNames(db: Database, table: string): Promise<Set<string>> {
  const columns = await db.all<{ name: string }[]>(`PRAGMA table_info(${table})`);
  return new Set(columns.map((column) => column.name));
}

export async function usersTableExists(db: Database): Promise<boolean> {
  const row = await db.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'"
  );
  return !!row;
}

export type AuthMigrationResult = {
  /** True when the users table was created by this run. */
  tablesCreated: boolean;
  /** Author columns added by this run, as "table.column". */
  columnsAdded: string[];
};

/**
 * Migration (3.0.0): creates the account tables, seeds the roles and their permissions
 * (INSERT OR IGNORE: initDb and migrateDb give the same result, a second run changes nothing),
 * and adds the nullable author columns. Existing orders and cash days are not modified (D-055).
 * Needs the orders and cash_days tables (run after the cash days migration). One transaction.
 */
export async function migrateAuth(db: Database): Promise<AuthMigrationResult> {
  await db.exec('BEGIN TRANSACTION');
  try {
    const tablesCreated = !(await usersTableExists(db));
    await db.exec(AUTH_TABLES_SQL);
    for (const role of ROLES) {
      await db.run('INSERT OR IGNORE INTO roles (name) VALUES (?)', [role]);
      for (const permission of ROLE_PERMISSIONS[role]) {
        await db.run('INSERT OR IGNORE INTO role_permissions (role, permission) VALUES (?, ?)', [
          role,
          permission,
        ]);
      }
    }
    const columnsAdded: string[] = [];
    for (const [table, column] of AUTHOR_COLUMNS) {
      if (!(await columnNames(db, table)).has(column)) {
        // Safe interpolation: both names come from the AUTHOR_COLUMNS constant.
        await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} INTEGER REFERENCES users (id)`);
        columnsAdded.push(`${table}.${column}`);
      }
    }
    await db.exec('COMMIT');
    return { tablesCreated, columnsAdded };
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

export async function countUsers(db: Database): Promise<number> {
  const row = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM users');
  return row?.n ?? 0;
}
