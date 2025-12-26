# Database Schema Analysis

## Summary

**Live Database:** 13 tables  
**Migrations in Repo:** Cover most tables, but some orphaned structures exist

---

## ⚠️ ORPHANED (In DB, No Migration - From Reverted Work)

### Tables to potentially DROP

| Table | Columns | Assessment |
|-------|---------|------------|
| `admin_views` | id, name, view_type, config, is_default, created_by, updated_by, created_at, updated_at | **PRD 7 saved views** - KEEP if implementing, else DROP |
| `audit_log` | id, actor_id, target_id, action, details, created_at | **Audit trail** - KEEP if useful, else DROP |
| `site_settings` | key, value, description, updated_by, updated_at | **Config storage** - KEEP if useful, else DROP |

### Columns to potentially DROP

| Table | Column | Assessment |
|-------|--------|------------|
| `feedback` | `completion_checklist` (jsonb) | No migration - orphaned from reverted work. **DROP** |

---

## ✓ CURRENT STATE (In DB, Has Migrations)

### Core Tables

- `users` - nickname, is_superadmin, display_name, units
- `leagues` - soft delete (deleted_at, deleted_by), backfill_limit
- `memberships` - standard
- `submissions` - flagged, proxy_member_id, verification fields
- `user_records` - stats tracking
- `proxy_members` - placeholder members

### Feedback System

- `feedback` - all expected columns present EXCEPT `status_changed_at`
- `module_feedback` - inline thumbs up/down
- `roadmap_votes` - priority voting
- `roadmap_comments` - (future feature)

### Feedback Table Current Columns

✅ id, type, subject, description, email, screenshot_url, user_agent, status, admin_notes  
✅ board_status, is_public, priority_order, completed_at, user_id, page_url  
✅ target_release, is_agent_working, agent_work_started_at, agent_work_subject  
✅ completion_status, created_at, updated_at  
⚠️ completion_checklist (orphaned - no migration)  
❌ status_changed_at (PRD 1 adds this)

---

## ❌ MISSING (Migrations Exist, Not in DB)

| Item | What | Migration |
|------|------|-----------|
| Column | `feedback.status_changed_at` | PRD 1 (new) |
| Index | `idx_feedback_status_type` | PRD 1 (new) |
| Index | `idx_feedback_status_changed` | PRD 1 (new) |
| Index | `idx_feedback_updated_at` | PRD 1 (new) |
| Function | `update_feedback_timestamps()` | PRD 1 (new) |
| Trigger | `feedback_timestamp_trigger` | PRD 1 (new) |
| Index | `idx_feedback_completion_status` | 20251224110000 (may not have run) |

---

## 🔧 RECOMMENDED ACTIONS

### Before PRD 1 Migration

```sql
-- 1. Drop orphaned column from feedback
ALTER TABLE feedback DROP COLUMN IF EXISTS completion_checklist;

-- 2. Add missing index from completion_status migration
CREATE INDEX IF NOT EXISTS idx_feedback_completion_status ON feedback(completion_status);
```

### Decision Needed: Orphaned Tables

**Option A: Keep for future use**

- `admin_views` → Will be used for PRD 7 (Saved Views)
- `audit_log` → Useful for admin audit trail
- `site_settings` → Useful for app configuration

**Option B: Drop and recreate cleanly**

```sql
DROP TABLE IF EXISTS admin_views CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
```

### After PRD 1

Run the new migration `20251226000000_feedback_timestamps.sql` which adds:

- `status_changed_at` column
- Auto-update trigger
- Composite indexes

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-26 | Schema analysis created from live DB dump |
