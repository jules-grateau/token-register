import { openDb } from '..';
import logger from '../../utils/logger';

(async () => {
  const db = await openDb();
  logger.info('Dropping all tables');

  try {
    await db.exec('DROP TABLE IF EXISTS products');
    await db.exec('DROP TABLE IF EXISTS orders');
    await db.exec('DROP TABLE IF EXISTS order_items');
    await db.exec('DROP TABLE IF EXISTS categories');
    await db.exec('VACUUM');
  } catch (error) {
    logger.error('Error dropping tables: %s', error);
  } finally {
    await db.close();
  }

  logger.info('All tables dropped');
})().catch((error) => {
  logger.error('Flush DB script failed: %s', error);
});
