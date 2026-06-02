# Skill: D1 Database Migration

## When to use

- Creating a new D1 migration
- Applying pending migrations
- Checking migration status
- Troubleshooting D1 schema issues

## Migration Workflow

### 1. Create a new migration

```bash
cd worker
npx wrangler d1 migrations create crosstide-db "description_of_change"
```

This creates a new `.sql` file in `worker/migrations/`.

### 2. Write the migration SQL

Edit the generated file in `worker/migrations/NNNN_description_of_change.sql`:

```sql
-- Migration: description_of_change
-- Always include IF NOT EXISTS for idempotency

CREATE TABLE IF NOT EXISTS new_table (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_new_table_created
  ON new_table(created_at);
```

### 3. Apply locally (dev)

```bash
npx wrangler d1 migrations apply crosstide-db --local
```

### 4. Apply to production

```bash
npx wrangler d1 migrations apply crosstide-db --remote
```

### 5. Verify status

```bash
npx wrangler d1 migrations list crosstide-db --remote
```

Or via the API:

```bash
curl https://crosstide-api.workers.dev/api/migrations/status
```

## Schema Conventions

| Convention | Rule |
|---|---|
| Primary keys | TEXT (UUID/nanoid) or INTEGER AUTOINCREMENT |
| Timestamps | INTEGER (Unix epoch seconds via `unixepoch()`) |
| Booleans | INTEGER (0/1) |
| JSON data | TEXT (stored as JSON string) |
| Indexes | Named `idx_{table}_{column}` |
| Foreign keys | Always declared with ON DELETE CASCADE |

## Current Schema

```sql
-- user_sync: Passkey-authenticated E2EE user data
-- alert_rules: DSL alert expressions per user
-- csp_reports: Security violation logging
-- provider_health: Circuit breaker state
```

## Rollback Strategy

D1 does not support automatic rollback. Write compensating migrations:

```sql
-- 0005_undo_previous.sql
DROP TABLE IF EXISTS accidentally_created;
ALTER TABLE existing_table DROP COLUMN IF EXISTS bad_column;
```

## Testing Migrations

```bash
# Run against local D1
npx wrangler d1 migrations apply crosstide-db --local

# Query local D1
npx wrangler d1 execute crosstide-db --local --command "SELECT * FROM sqlite_master WHERE type='table'"
```
