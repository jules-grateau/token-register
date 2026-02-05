import { openDb } from '../index';
import logger from '../../utils/logger';

/**
 * Migration: Add snapshot columns to order_items table
 *
 * This migration adds product snapshot fields to the order_items table to preserve
 * historical order accuracy even when products are modified or deleted from the catalog.
 *
 * Changes:
 * - Add product_name column (snapshot of product name at time of order)
 * - Add product_price column (snapshot of product price at time of order)
 * - Add category_name column (snapshot of category name at time of order)
 *
 * Backfill Strategy:
 * - For existing order_items with valid product references: populate from current products/categories data
 * - For orphaned order_items (product already deleted): use fallback values
 */

async function migrateOrderItems() {
  console.log('Starting order_items migration...');
  logger.info('Starting order_items migration...');

  const db = await openDb();
  console.log('Database connection opened');

  try {
    // Check if migration is already complete
    const tableInfo = await db.all<Array<{ name: string }>>('PRAGMA table_info(order_items)');
    const columnNames = tableInfo.map(col => col.name);

    const hasProductName = columnNames.includes('product_name');
    const hasProductPrice = columnNames.includes('product_price');
    const hasCategoryName = columnNames.includes('category_name');

    if (hasProductName && hasProductPrice && hasCategoryName) {
      console.log('Migration already complete - all snapshot columns exist');
      logger.info('Migration already complete - all snapshot columns exist');
      return;
    }

    await db.exec('BEGIN TRANSACTION');
    console.log('Transaction started');
    logger.info('Transaction started');

    logger.info('Adding snapshot columns to order_items table...');

    if (!hasProductName) {
      await db.exec(`ALTER TABLE order_items ADD COLUMN product_name TEXT;`);
      console.log('Added product_name column');
      logger.info('Added product_name column');
    } else {
      console.log('product_name column already exists, skipping');
    }

    if (!hasProductPrice) {
      await db.exec(`ALTER TABLE order_items ADD COLUMN product_price INTEGER;`);
      console.log('Added product_price column');
      logger.info('Added product_price column');
    } else {
      console.log('product_price column already exists, skipping');
    }

    if (!hasCategoryName) {
      await db.exec(`ALTER TABLE order_items ADD COLUMN category_name TEXT;`);
      console.log('Added category_name column');
      logger.info('Added category_name column');
    } else {
      console.log('category_name column already exists, skipping');
    }

    logger.info('Backfilling snapshot data from existing products...');

    const backfillResult = await db.run(`
      UPDATE order_items
      SET
        product_name = (SELECT name FROM products WHERE id = order_items.product_id),
        product_price = (SELECT price FROM products WHERE id = order_items.product_id),
        category_name = (
          SELECT c.name FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE p.id = order_items.product_id
        )
      WHERE product_id IN (SELECT id FROM products);
    `);
    logger.info(`Backfilled ${backfillResult.changes ?? 0} order items with current product data`);

    logger.info('Handling orphaned order items (products already deleted)...');

    const orphanResult = await db.run(`
      UPDATE order_items
      SET
        product_name = 'Unknown Product (Deleted)',
        product_price = 0,
        category_name = 'Unknown Category'
      WHERE product_name IS NULL;
    `);

    if (orphanResult.changes && orphanResult.changes > 0) {
      logger.warn(
        `Found ${orphanResult.changes} orphaned order items (products already deleted). ` +
        `Set fallback values for historical preservation.`
      );
    } else {
      logger.info('No orphaned order items found');
    }

    await db.exec('COMMIT');
    logger.info('Migration completed successfully!');
    logger.info('order_items table now includes: product_name, product_price, category_name');

  } catch (error) {
    await db.exec('ROLLBACK');
    logger.error('Migration failed, rolled back transaction:', error);
    throw new Error(`Migration failed: ${String(error)}`);
  } finally {
    await db.close();
  }
}

void migrateOrderItems()
  .then(() => {
    console.log('='.repeat(50));
    console.log('Migration script completed successfully');
    console.log('='.repeat(50));
    logger.info('='.repeat(50));
    logger.info('Migration script completed');
    logger.info('='.repeat(50));
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    logger.error('Migration script failed:', error);
    process.exit(1);
  });
