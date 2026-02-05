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
