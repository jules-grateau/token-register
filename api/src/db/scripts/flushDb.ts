import { log } from 'console';
import { openDb } from '..';
import logger from '../../utils/logger';


openDb().then((db) => {
    logger.info('Dropping all tables');

    try {
        db.exec('DROP TABLE IF EXISTS products');
        db.exec('DROP TABLE IF EXISTS orders');
        db.exec('DROP TABLE IF EXISTS order_items');
        db.exec('DROP TABLE IF EXISTS categories');
        db.exec('VACUUM');
    } catch(error) {
        logger.error('Error dropping tables: %s', error);
    } finally {
        db.close();
    }

    logger.info('All tables dropped');
});