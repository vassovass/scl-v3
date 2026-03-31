---
## Document Context
**What**: Supabase database schema reference covering core tables (users, leagues, memberships, submissions), menu system, proxy user model, subscription/billing tables, and key relationships
**Why**: Quick lookup for table structures, column names, and foreign key relationships when writing queries or migrations
**Status**: Current
**Last verified**: 2026-03-31
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

## Subscription & Billing Tables (PRD 74)

Provider-agnostic schema. `external_*` columns work with Paystack, Paddle, or Stripe. All prices in cents (integer).

| Table | Key Columns |
|-------|------------|
| `subscription_tiers` | id, slug (unique), name, description, monthly_price_cents, annual_price_cents, member_limit (null=unlimited), is_active, sort_order, features (JSONB), grace_period_days, updated_by, created_at, updated_at |
| `league_subscriptions` | id, league_id (FK→leagues CASCADE), tier_id (FK→subscription_tiers RESTRICT), status, billing_interval, current_period_start, current_period_end, trial_ends_at, price_locked_at_cents, canceled_at, external_subscription_id, external_customer_id, metadata (JSONB), created_at, updated_at |
| `payment_history` | id, league_subscription_id (FK CASCADE), amount_cents, currency, status, external_payment_id, external_invoice_id, payment_method_summary, failure_reason, metadata (JSONB), created_at |

### leagues table additions (PRD 74)

| Column | Type | Purpose |
|--------|------|---------|
| `pay_gate_override` | BOOLEAN (nullable) | null=follow global, true=force gate on, false=force free |

### RLS Policies (billing tables)

| Role | subscription_tiers | league_subscriptions | payment_history |
|------|--------------------|----------------------|-----------------|
| Anonymous / authenticated | Read active tiers only | No access | No access |
| League owner | Read active tiers | Read own league's row | Read own league's payments |
| SuperAdmin | Full CRUD | Full CRUD | Full CRUD |

### Indexes

| Index | Purpose |
|-------|---------|
| `idx_subscription_tiers_active_sort` | Public pricing page (active tiers, sorted) |
| `idx_league_subscriptions_one_active` | Partial unique: one active/trialing/past_due per league |
| `idx_league_subscriptions_league_id` | League subscription lookups |
| `idx_league_subscriptions_status` | Status-based queries |
| `idx_payment_history_subscription` | Payment history per subscription |

### App Settings Added (PRD 74)

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `feature_pay_gate` | boolean | false | Master switch for billing system |
| `pay_gate_global` | boolean | false | Enforce pay gate platform-wide |
| `free_tier_member_limit` | number | 3 | Max members on free tier (1–100) |

### PRD 76 Additions

#### New columns on `league_subscriptions`

| Column | Type | Purpose |
|--------|------|---------|
| `price_locked_at_cents` | INTEGER (nullable) | Grandfathered price locked at subscription creation. Renewals honor this, not current tier price. |
| `canceled_at` | TIMESTAMPTZ (nullable) | When the user requested cancellation. Access continues until current_period_end. |

Status check constraint now includes: `active`, `past_due`, `canceled`, `trialing`, `paused`, `expired`.

#### New tables (PRD 76)

| Table | Key Columns |
|-------|------------|
| `subscription_events` | id, league_subscription_id (FK CASCADE), from_status, to_status, reason, metadata (JSONB), triggered_by, created_at |
| `webhook_events` | id, provider, event_id, event_type, payload (JSONB), processed_at, error, created_at |

#### RLS Policies (PRD 76 tables)

| Role | subscription_events | webhook_events |
|------|--------------------|--------------------|
| League owner | Read own subscription events | No access |
| SuperAdmin | Full CRUD | Full CRUD |

#### Indexes (PRD 76)

| Index | Purpose |
|-------|---------|
| `idx_subscription_events_subscription` | Event lookup per subscription |
| `idx_subscription_events_created` | Chronological event queries |
| `idx_webhook_events_provider_event_id` | Unique per provider+event_id for idempotency |
| `idx_webhook_events_created` | Chronological webhook queries |

### Convention: Missing subscription row = Free tier

Leagues without a `league_subscriptions` row are treated as Free tier. No backfill migration needed when pay gate activates. PRD 75 gate logic should handle `null` subscription gracefully.
