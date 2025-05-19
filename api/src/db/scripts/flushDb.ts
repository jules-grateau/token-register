import { openDb } from '..';


openDb().then((db) => {
    db.exec('DROP TABLE IF EXISTS products');
    db.exec('DROP TABLE IF EXISTS orders');
    db.exec('DROP TABLE IF EXISTS order_items');
    db.exec('DROP TABLE IF EXISTS categories');
    db.exec('VACUUM');
    db.close();
});