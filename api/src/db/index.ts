import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import logger from '../utils/logger';

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
  return db;
}
