import { openDb } from '..';
import logger from '../../utils/logger';

(async () => {
  const db = await openDb();
  logger.info('Migrating operation');

  try {
    await db.exec('ALTER TABLE order_items ADD COLUMN discountedAmount INTEGER;');
    logger.info('Migration completed');
  } catch (error) {
    logger.error('Error migrating database: %s', error);
  } finally {
    await db.close();
  }
})().catch((err) => {
  logger.error('Migration script failed: %s', err);
});
