import { log } from 'console';
import { openDb } from '..';
import logger from '../../logger';


openDb().then((db) => {
    logger.info('Migrating operation');

    try {
        db.exec('ALTER TABLE order_items ADD COLUMN discountedAmount INTEGER;');
    } catch(error) {
        logger.error('Error migrating database: %s', error);
    } finally {
        db.close();
    }

    logger.info('All tables dropped');
});