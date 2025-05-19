import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Async function to open the DB connection
export async function openDb() {
  const db = await open({
    filename: path.resolve(__dirname, process.env.DATABASE_PATH || "./data/database.sqlite"),  
        driver: sqlite3.Database
  });
  return db;
}