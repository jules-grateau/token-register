# Database Migrations Guide

This document provides general guidance for database migrations in the token-register project.

## Overview

Token-register uses SQLite for data storage. Database schema changes are managed through migration scripts located in `api/src/db/scripts/`.

## Migration Principles

1. **Idempotent**: All migrations must be safe to run multiple times
2. **Transactional**: Migrations should use transactions (BEGIN/COMMIT/ROLLBACK)
3. **Backward Compatible**: When possible, avoid breaking changes
4. **Documented**: Each migration should have accompanying documentation

## Migration Scripts

### Initialization

**Script**: `api/src/db/scripts/initDb.ts`
**Purpose**: Creates initial database schema and seeds default data
**When**: Run on fresh installations or empty databases

```bash
# Development
npm run dev:db:init -w=api

# Production
npm run prod:db:init
```

### Schema Migrations

**Script Pattern**: `api/src/db/scripts/migrateDb.ts`
**Purpose**: Alter existing schema (add columns, indexes, etc.)
**When**: Run when upgrading to a version with schema changes

```bash
# Development
npm run dev:db:migrate -w=api

# Production
npm run prod:db:migrate
```

### Instance currency (settings table)

**Script**: `api/src/db/scripts/migrateDb.ts` (step `migrateInstanceCurrency`, runs on every start)
**Schema change**: creates `settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)` if missing.
**Data**: inserts `currency` = `CURRENCY` env var on an empty database, or `TOKEN` on a database
that already holds products or orders (it predates the currency feature). Amounts are not touched.
**Check**: fails (exit 1, container stopped) if `CURRENCY` differs from the recorded currency.

Rollback: the `settings` table is ignored by older versions; it can stay, or be dropped with
`DROP TABLE settings;`.

### Currency conversion (admin command, never automatic)

**Script**: `api/src/db/scripts/convertCurrency.ts`

```bash
npm run prod:db:convert-currency -- --to=EUR           # preview, writes nothing
npm run prod:db:convert-currency -- --to=EUR --apply   # converts in one transaction
```

Converts `products.price`, `order_items.product_price` and `order_items.discountedAmount`, then
updates `settings.currency`. Back up the database first. Full procedure:
[deploy/README.md > Currency](./deploy/README.md#currency).

### Order payments (1.3.0)

**Script**: `api/src/db/scripts/migrateDb.ts` (step `migrateOrderPayments`, runs on every start;
logic in `api/src/db/orderPayment.ts`)
**Schema change**: adds `orders.cash_amount INTEGER` and `orders.card_amount INTEGER`, both
nullable, in the smallest unit (cents on EUR instances). Only missing columns are added, in one
transaction, so the step is idempotent. New databases get them from `initDb.ts`.
**Data**: existing orders keep `NULL` in both columns, meaning "no payment recorded". Nothing is
backfilled. Token instances always keep `NULL` (D-033).
**Conversion**: `convertCurrency.ts` converts both columns to euros with the history; a conversion
to tokens clears them (D-036), and the preview says how many orders lose their cash / card split.
**API**: from 1.3.0, an EUR instance refuses an order without payment (D-035), including the
bare-array body of older clients: reload open tabs after the deploy.

Rollback: older versions ignore the two columns (they only insert `date`); they can stay. To drop
them (SQLite >= 3.35): `ALTER TABLE orders DROP COLUMN cash_amount; ALTER TABLE orders DROP COLUMN card_amount;`

## Deployment Workflow

### Development Environment

1. Pull latest code
2. Run `npm install`
3. Backup database (optional): `cp api/src/db/data/database.sqlite api/src/db/data/database.sqlite.backup`
4. Run migration: `npm run dev:db:migrate -w=api`
5. Verify with tests: `npm test -w=api`

### Docker Production Environment

**New Installations**:
- Migrations run automatically via `entrypoint.sh`
- No manual intervention needed

**Existing Installations**:
1. Backup database:
   ```bash
   docker cp <container-name>:/path/to/database.sqlite ./backup/database-$(date +%Y%m%d).sqlite
   ```

2. Pull latest image:
   ```bash
   docker pull julesgrateau/token-register:latest
   ```

3. Run migration (automatic on restart, or manual):
   ```bash
   # Option A: Automatic on container restart
   docker restart <container-name>

   # Option B: Manual in running container
   docker exec -it <container-name> npm run prod:db:migrate
   ```

4. Verify logs:
   ```bash
   docker logs <container-name> | grep -i migration
   ```

## Feature-Specific Migration Guides

Each feature with database changes includes a deployment guide:

- [002: Order History Preservation](./specs/002-order-history-preservation/deployment.md)

## Rollback Strategy

### General Approach

1. **Stop application**
2. **Restore database backup**
3. **Revert to previous application version**

### SQLite Considerations

SQLite has limited ALTER TABLE support:
- Can ADD COLUMN (used by migrations)
- Cannot DROP COLUMN directly
- Cannot modify column types

To rollback a column addition, you must recreate the table (see feature-specific guides).

## Best Practices

### For Developers

1. **Always use transactions** in migration scripts
2. **Check if migration already applied** before making changes
3. **Handle errors gracefully** with try/catch and rollback
4. **Log migration progress** for debugging
5. **Test migrations** on development databases first
6. **Document breaking changes** in deployment guides

### For Operators

1. **Always backup before migration** in production
2. **Run migrations during low-traffic periods** when possible
3. **Monitor application logs** after migration
4. **Test critical workflows** after deployment
5. **Keep backup for 30+ days** after successful migration

## Troubleshooting

### Migration Script Fails

**Check**:
- Database file permissions
- Disk space available
- Database not locked by another process
- Log output for specific error message

**Solutions**:
- Ensure application is stopped during migration
- Free up disk space if needed
- Check file system permissions
- Review feature-specific deployment guide

### Application Won't Start After Migration

**Check**:
- Migration completed successfully (check logs)
- No syntax errors in SQL (migration uses transactions, should rollback)
- Application code compatible with new schema

**Solutions**:
- Review logs: `docker logs <container-name>`
- Run migration manually if it didn't complete
- Restore backup and redeploy with previous version

## Migration Checklist

Use this checklist for production migrations:

- [ ] Review feature deployment guide
- [ ] Backup database
- [ ] Verify backup integrity
- [ ] Schedule deployment window (if needed)
- [ ] Pull/build latest application version
- [ ] Run migration (or restart to auto-migrate)
- [ ] Verify migration logs show success
- [ ] Test critical application workflows
- [ ] Monitor application logs for errors
- [ ] Document deployment completion

## Related Documentation

- [Project README](./README.md)
- [Docker Deployment Guide](./README.md#docker)
- [Feature Specifications](./specs/)

---

**Last Updated**: 2026-02-05
