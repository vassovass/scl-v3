# PRD 68 — Comprehensive Database Schema Documentation

> **Status:** Proposed
> **Priority:** Medium
> **Type:** Documentation / Developer Experience

---

## Problem

Current `DATABASE_SCHEMA.md` is 49 lines — far too thin for a project with 66+ PRDs and extensive database usage. AI agents lack schema knowledge, leading to:

- **Guessed column names** — agents write wrong column names and get runtime errors
- **Repeated MCP queries** — migration design requires manually querying Supabase MCP every time
- **Missing relationships** — no documentation of foreign keys, indexes, or RLS policies
- **Onboarding friction** — new developers/agents can't understand the data model without live database access

---

## Desired Outcome

Comprehensive, auto-maintainable schema documentation that gives agents full context for writing queries, designing migrations, and understanding table relationships — without needing live database access.

---

## Success Criteria

| Criteria | Target |
|----------|--------|
| All tables documented with columns, types, constraints | 100% coverage |
| Relationships and foreign keys mapped | All FKs documented |
| RLS policy summary per table | Role-based read/write/delete |
| Key indexes documented | All non-default indexes |
| File size | Under 500 lines (use sections/hierarchy) |

---

## Proposed Approach

1. **Extract full schema via Supabase MCP** — use `execute_sql` to pull tables, columns, types, constraints, foreign keys, and indexes from `information_schema` and `pg_catalog`
2. **Document table relationships** — dependency graph showing FK chains and self-references
3. **Add RLS policy summary** — which roles can read/write/delete per table
4. **Organize by domain** — group tables into logical sections:
   - Auth & Users (users, user_records, user_preferences)
   - Leagues & Memberships (leagues, memberships)
   - Steps & Submissions (submissions, daily aggregates)
   - Menu System (menu_definitions, menu_items, menu_locations)
   - Admin & Settings (app_settings, feedback, module_feedback)
   - Analytics & Health (any tracking/measurement tables)
5. **Reference from skills/rules** — add to supabase-patterns skill or create a rule that triggers on migration files

---

## Risks

| Risk | Mitigation |
|------|------------|
| Schema changes make docs stale | Regenerate from MCP periodically; add reminder to migration skill |
| File grows beyond 500 lines | Use collapsed sections, reference sub-docs for edge cases |
| Missing tables from MCP extraction | Cross-reference with existing migrations in `supabase/migrations/` |

---

## Dependencies

- Supabase MCP access (`execute_sql` tool)
- Current migration files in `supabase/migrations/` for cross-reference

---

## Implementation Notes

The regeneration process should be repeatable:

```sql
-- Core extraction queries
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_schema = 'public';

SELECT tc.table_name, tc.constraint_type, kcu.column_name,
       ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu USING (constraint_name)
LEFT JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
WHERE tc.table_schema = 'public';
```

Output should replace the current `docs/DATABASE_SCHEMA.md` content while preserving the domain-grouped structure.
