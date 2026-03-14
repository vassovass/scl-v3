---
description: Database migration conventions, naming, RLS policies, and schema documentation
paths:
  - supabase/migrations/**
---

# Migration Rules

## Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name.sql
```
Example: `20260314000000_add_user_preferences.sql`

## Before Writing a Migration

1. **Check existing schema** — Use Supabase MCP `execute_sql` to verify current table state
2. **Check DATABASE_SCHEMA.md** — Understand existing relationships before adding to them
3. **Check for existing migrations** that touch the same tables — avoid conflicts

## Migration Standards

- Always include `IF NOT EXISTS` / `IF EXISTS` guards where appropriate
- Add comments explaining WHY, not just WHAT
- Include rollback considerations (what would reverting look like?)
- RLS policies: every new table needs explicit RLS policies — never leave a table without them
- Foreign keys: always declare `ON DELETE` behavior (CASCADE, SET NULL, or RESTRICT)

## ⚠️ MANDATORY: Update Schema Documentation

After creating any migration:

1. **Update `docs/DATABASE_SCHEMA.md`** — add new tables/columns/relationships
2. **If adding RLS policies** — document which roles can read/write/delete
3. **If adding indexes** — document what queries they optimize

## Testing Migrations

- Test via Supabase MCP `execute_sql` before committing
- Verify RLS policies work for each role (admin, member, public)
- Run `npx tsc --noEmit` — migration-related type changes may break TypeScript

## Related

- `supabase-patterns` skill — full Supabase client patterns
- `docs/DATABASE_SCHEMA.md` — schema reference
