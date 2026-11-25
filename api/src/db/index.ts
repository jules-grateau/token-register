import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import logger from '../utils/logger';

/**
 * How long a statement waits for another connection's write lock before failing with
 * SQLITE_BUSY. Each request opens its own connection, and the writes that must stay consistent
 * with the open cash day (order, close, deletion: D-061) take the lock up front
 * (BEGIN IMMEDIATE): a second request then waits for the first instead of failing.
 */
export const BUSY_TIMEOUT_MS = 5000;

export const getDatabasePath = (): string => {
  const dbPathFromEnv = process.env.DATABASE_PATH;

  if (!dbPathFromEnv) {
    logger.error('FATAL: DATABASE_PATH environment variable is not set.');
    process.exit(1);
  }

  return path.resolve(dbPathFromEnv);
};

export async function openDb() {
  const db = await open({
    filename: getDatabasePath(),
    driver: sqlite3.Database,
  });
  db.configure('busyTimeout', BUSY_TIMEOUT_MS);
  return db;
}
