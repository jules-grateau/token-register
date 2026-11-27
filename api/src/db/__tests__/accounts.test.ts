import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { ensureCashDaysTable } from '../cashDays';
import { migrateAuth } from '../auth';
import { ensureInitialAdmin, resetAdminPassword } from '../accounts';
import { verifyPassword } from '../../utils/password';

// Generated, fake values: never a real account (public repository).
const PASSWORD = `pw-${Math.random().toString(36).slice(2)}`;

async function createDb(withAuth = true): Promise<Database> {
  const db = await open({ filename: ':memory:', driver: sqlite3.Database });
  await db.exec(
    'CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL)'
  );
  await ensureCashDaysTable(db);
  if (withAuth) await migrateAuth(db);
  return db;
}

type UserRow = {
  id: number;
  username: string;
  role: string;
  active: number;
  password_hash: string;
};
const users = (db: Database) => db.all<UserRow[]>('SELECT * FROM users ORDER BY id');

describe('first admin (D-063, answers 3 a and 10 a)', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createDb();
  });
  afterEach(async () => {
    await db.close();
  });

  it('refuses to start without INITIAL_ADMIN_*, naming the missing variables', async () => {
    await expect(ensureInitialAdmin(db, {})).rejects.toThrow(
      'Missing INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD.'
    );
    await expect(ensureInitialAdmin(db, { INITIAL_ADMIN_USERNAME: 'admin' })).rejects.toThrow(
      'Missing INITIAL_ADMIN_PASSWORD.'
    );
    await expect(
      ensureInitialAdmin(db, { INITIAL_ADMIN_USERNAME: 'admin', INITIAL_ADMIN_PASSWORD: '12345' })
    ).rejects.toThrow('INITIAL_ADMIN_PASSWORD: The password must be at least 6 characters long.');
    await expect(
      ensureInitialAdmin(db, { INITIAL_ADMIN_USERNAME: 'a b', INITIAL_ADMIN_PASSWORD: PASSWORD })
    ).rejects.toThrow('INITIAL_ADMIN_USERNAME: The username must be 3 to 32 characters');
    expect(await users(db)).toEqual([]);
  });

  it('never puts the password in the error message', async () => {
    const error = await ensureInitialAdmin(db, {
      INITIAL_ADMIN_USERNAME: 'a b',
      INITIAL_ADMIN_PASSWORD: PASSWORD,
    }).catch((e: unknown) => e);
    expect(String(error)).not.toContain(PASSWORD);
  });

  it('creates an admin while there is no account, then ignores the variables', async () => {
    const env = { INITIAL_ADMIN_USERNAME: '  Chef  ', INITIAL_ADMIN_PASSWORD: PASSWORD };
    expect(await ensureInitialAdmin(db, env)).toEqual({ created: true, username: 'Chef' });
    const [admin] = await users(db);
    expect(admin).toMatchObject({ username: 'Chef', role: 'admin', active: 1 });
    expect(admin.password_hash).not.toContain(PASSWORD);
    expect(await verifyPassword(PASSWORD, admin.password_hash)).toBe(true);

    expect(await ensureInitialAdmin(db, { INITIAL_ADMIN_USERNAME: 'other' })).toEqual({
      created: false,
    });
    expect(await ensureInitialAdmin(db, {})).toEqual({ created: false });
    expect(await users(db)).toHaveLength(1);
  });

  it('asks for the migration when the account tables are missing', async () => {
    const bare = await createDb(false);
    await expect(ensureInitialAdmin(bare, {})).rejects.toThrow('Run the database migration first');
    await bare.close();
  });
});

describe('reset-admin-password (D-063, answer 4 a)', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createDb();
    await db.exec(`
      INSERT INTO users (id, username, password_hash, role, active, created_at, updated_at)
        VALUES (1, 'Chef', 'old', 'cashier', 0, 0, 0), (2, 'autre', 'other', 'cashier', 1, 0, 0);
      INSERT INTO sessions VALUES ('a', 1, 0, 0), ('b', 1, 0, 0), ('c', 2, 0, 0);
    `);
  });
  afterEach(async () => {
    await db.close();
  });

  it('sets the password, reactivates, makes admin again and closes its sessions', async () => {
    expect(await resetAdminPassword(db, ' chef ', PASSWORD)).toEqual({
      action: 'updated',
      closedSessions: 2,
    });
    const [chef, other] = await users(db);
    expect(chef).toMatchObject({ id: 1, username: 'Chef', role: 'admin', active: 1 });
    expect(await verifyPassword(PASSWORD, chef.password_hash)).toBe(true);
    // Not a temporary password in this version (answer 4 a).
    expect(await db.get('SELECT must_change_password FROM users WHERE id = 1')).toEqual({
      must_change_password: 0,
    });
    expect(other.password_hash).toBe('other');
    expect(await db.all('SELECT token_hash FROM sessions')).toEqual([{ token_hash: 'c' }]);
  });

  it('creates an admin when the account does not exist', async () => {
    expect(await resetAdminPassword(db, 'secours', PASSWORD)).toEqual({
      action: 'created',
      closedSessions: 0,
    });
    expect((await users(db))[2]).toMatchObject({ username: 'secours', role: 'admin', active: 1 });
  });

  it('validates everything before writing', async () => {
    await expect(resetAdminPassword(db, 'chef', undefined)).rejects.toThrow(
      'Missing RESET_ADMIN_PASSWORD.'
    );
    await expect(resetAdminPassword(db, 'chef', '12345')).rejects.toThrow('at least 6 characters');
    await expect(resetAdminPassword(db, 'x', PASSWORD)).rejects.toThrow('3 to 32 characters');
    expect((await users(db))[0]).toMatchObject({
      password_hash: 'old',
      role: 'cashier',
      active: 0,
    });
    expect(await db.get('SELECT COUNT(*) AS n FROM sessions')).toEqual({ n: 3 });
  });
});
