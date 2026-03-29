---
## Document Context
**What**: Supabase database schema reference covering core tables (users, leagues, memberships, submissions), menu system, proxy user model, and key relationships
**Why**: Quick lookup for table structures, column names, and foreign key relationships when writing queries or migrations
**Status**: Current
**Last verified**: 2026-03-29
**Agent note**: This summary should be sufficient to assess relevance. Only read further if this document matches your current task.
---

# Database Schema Reference

## Core Tables

| Table | Key Columns |
|-------|------------|
| `users` | id, display_name, `nickname`, units, is_superadmin, `managed_by` (proxy FK), `is_proxy`, `invite_code` |
| `leagues` | id, name, invite_code, owner_id, `deleted_at` (soft delete) |
| `memberships` | league_id, user_id, role |
| `submissions` | league_id, user_id, for_date, steps, verified, `flagged` |
| `feedback` | type, subject, description, screenshot_url, board_status, is_public |
| `module_feedback` | module_id, feedback_type, comment, screenshot_url |
| `user_records` | user_id, best_day_steps, best_day_date, current_streak, total_steps_lifetime |
| `app_settings` | key, value (jsonb), category, value_type, visible_to, editable_by |

## Menu System Tables (PRD 24)

| Table | Key Columns |
|-------|------------|
| `menu_definitions` | id, label, description |
| `menu_items` | id, menu_id, parent_id, item_key, label, href, icon, visible_to, requires_league, on_click, sort_order |
| `menu_locations` | location, menu_ids[], show_logo, show_sign_in, show_user_menu, show_admin_menu |

## Proxy User Model (PRD 41)

```sql
-- Real user: managed_by = NULL, is_proxy = false
-- Proxy user: managed_by = manager_id, is_proxy = true
-- Claimed proxy: managed_by = NULL, is_proxy = false (converted to real user)
```

Parent accounts can manage proxy users via the "Act As" pattern. See `.claude/rules/architecture.md` for the `switchProfile()` hook.

## Key Relationships

- `users.id` → `memberships.user_id` → `leagues.id`
- `users.id` → `submissions.user_id`
- `users.managed_by` → `users.id` (self-referencing FK for proxy)
- `leagues.owner_id` → `users.id`
- `menu_items.menu_id` → `menu_definitions.id`
- `menu_items.parent_id` → `menu_items.id` (self-referencing for nesting)

## League-Agnostic Steps

Steps are submitted ONCE and apply to ALL leagues a user belongs to. There is no per-league step submission. Leaderboard queries aggregate steps across active leagues.

## Soft Deletes

Leagues use `deleted_at` timestamp for soft deletion. Always filter `WHERE deleted_at IS NULL` in queries.
