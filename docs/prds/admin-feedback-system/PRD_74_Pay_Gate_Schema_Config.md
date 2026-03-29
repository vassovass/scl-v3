# PRD 74: Pay Gate Schema & Config

> **Order:** 74
> **Status:** 📋 Proposed
> **Type:** Feature
> **Dependencies:** PRD 72 (Payment Provider Research)
> **Blocks:** PRD 75 (Pay Gate UI), PRD 76 (Subscriptions)
> **Sprint:** F, Track 1 (F1.1)

---

## 🎯 Objective

Establish a fully SuperAdmin-configurable tier and subscription schema that powers StepLeague's freemium model. Tier names, prices, member limits, and billing intervals are stored in the database and editable through the SuperAdmin UI — nothing is hardcoded. A global pay gate toggle and per-league override give SuperAdmin granular control over where the paywall is enforced. The output is three Supabase tables (`subscription_tiers`, `league_subscriptions`, `payment_history`), a SuperAdmin management UI, and the feature flag / app setting wiring that PRD 75 and PRD 76 consume.

**Problem Solved:** Today StepLeague has no billing infrastructure. The pricing page (PRD 33) displays tiers statically. There is no database representation of tiers, no way to associate a league with a paid plan, and no mechanism for SuperAdmin to adjust pricing without a code deploy. This PRD creates the foundational data layer and admin controls so that PRD 75 can render gate UI and PRD 76 can process actual subscriptions.

---

## ⚠️ Research-First Mandate

Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — existing SuperAdmin settings patterns, feature flag system, Supabase subscription schema best practices, SaaS billing data models, grandfathering patterns in subscription systems, and similar open-source implementations. This research phase should directly inform the schema design and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `src/hooks/useAppSettings.ts` | `useAppSettings()` hook — existing pattern for reading SuperAdmin-configurable values (PRD 25) |
| `src/hooks/useFeatureFlag.ts` | `useFeatureFlag()` hook — feature flag consumption pattern |
| `src/app/(authenticated)/admin/` | Existing SuperAdmin pages — follow layout, nav, and auth patterns |
| `src/lib/adminPages.ts` | Admin nav registry — new pages must be added here |
| `src/lib/api/handler.ts` | `withApiHandler` — all API routes use this with `auth: 'superadmin'` for admin endpoints |
| `src/lib/supabase/admin.ts` | `adminClient` — server-side DB access bypassing RLS |
| `src/app/(public)/pricing/page.tsx` | Current static pricing page (PRD 33) — will consume tier data after this PRD |
| `docs/prds/admin-feedback-system/PRD_25_User_Preferences.md` | Settings architecture and `useAppSettings` pattern |
| `docs/prds/admin-feedback-system/PRD_26_SuperAdmin_Settings.md` | SuperAdmin settings system, feature flags, settings cascade |
| `docs/prds/admin-feedback-system/PRD_33_Pricing_HowItWorks.md` | Pricing tier definitions and freemium model |
| `docs/prds/admin-feedback-system/PRD_72_Payment_Provider_Research.md` | Payment provider selection — must be completed first |
| `.claude/skills/api-handler/SKILL.md` | `withApiHandler` pattern reference |
| `.claude/skills/supabase-patterns/SKILL.md` | Database patterns, migrations, RLS policies |
| `.claude/skills/design-system/SKILL.md` | CSS variables, dark/light mode, shadcn/ui component patterns |
| `.claude/skills/architecture-philosophy/SKILL.md` | Systems thinking, modularity, future-proofing |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Create migration, verify tables, test RLS policies |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Research existing SuperAdmin settings, feature flags, and pricing page patterns `[PARALLEL with 2]` |
| 2 | `[READ-ONLY]` | Research SaaS billing schema best practices and grandfathering patterns `[PARALLEL with 1]` |
| 3 | `[WRITE]` | Create Supabase migration: `subscription_tiers`, `league_subscriptions`, `payment_history` tables `[SEQUENTIAL]` |
| 4 | `[WRITE]` | Seed default tier data (Free, Standard, Premium, Enterprise) via migration `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Add feature flag (`pay_gate_enabled`) and app settings (`pay_gate_global`, `free_tier_member_limit`) `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Build SuperAdmin Tier Management UI (CRUD for tiers, toggle for pay gate) `[PARALLEL with 7]` |
| 7 | `[WRITE]` | Build API routes for tier CRUD and pay gate toggle `[PARALLEL with 6]` |
| 8 | `[WRITE]` | Add per-league pay gate override to league settings `[SEQUENTIAL]` |
| 9 | `[READ-ONLY]` | Verify: `npx tsc --noEmit`, `npx vitest run`, dark/light mode, mobile responsiveness `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Tier Configuration — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **`subscription_tiers` table exists** with columns: `id`, `slug`, `name`, `description`, `monthly_price_cents`, `annual_price_cents`, `member_limit` (nullable for unlimited), `is_active`, `sort_order`, `features` (JSONB), `created_at`, `updated_at` | No database representation of tiers — pricing is static HTML | Table created via migration, queryable via `adminClient` |
| **A-2** | **Default tiers seeded** — Free ($0, 3 members), Standard ($4.99/mo, $49/yr, 10 users), Premium ($9.99/mo, $99/yr, 25 users), Enterprise (contact, unlimited) | Fresh installs have no tier data | Migration seeds 4 rows; `SELECT count(*) FROM subscription_tiers` returns 4 after migration |
| **A-3** | **All tier values are SuperAdmin-editable** — names, prices, limits, descriptions, active status, sort order, features | Changing pricing requires a code deploy | SuperAdmin can update any field via the UI and changes persist immediately |
| **A-4** | **Tier soft-delete via `is_active` flag** — deactivated tiers are hidden from public but preserved for historical subscriptions | Deleting tiers would break existing subscription references | Deactivated tier no longer appears on pricing page but existing `league_subscriptions` rows referencing it remain valid |
| **A-5** | **Prices stored in cents (integer)** to avoid floating-point rounding | Currency math with floats causes billing errors (e.g., $4.99 stored as 499) | All price columns are `integer` type, UI converts to display format |
| **A-6** | **`features` JSONB column** holds tier-specific feature flags (e.g., `{"custom_branding": true, "analytics_dashboard": true}`) | Different tiers unlock different platform features beyond member limits | JSONB column accepts arbitrary key-value pairs, SuperAdmin UI provides a key-value editor |

### Section B: Pay Gate Toggle — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Global pay gate feature flag** (`pay_gate_enabled`) controls whether any pay gate logic runs | Need ability to launch without paywall and enable later | `useFeatureFlag('pay_gate_enabled')` returns boolean; when false, all leagues behave as free |
| **B-2** | **Global pay gate app setting** (`pay_gate_global`) toggleable from SuperAdmin UI | SuperAdmin needs a single switch to enable/disable billing platform-wide | Toggle in SuperAdmin settings; `useAppSettings()` returns current state |
| **B-3** | **Per-league pay gate override** — each league can have pay gate independently enabled or disabled regardless of global setting | Some leagues may be sponsored or grandfathered as free while others are gated | `league_subscriptions` table or league metadata includes `pay_gate_override` (null = follow global, true = force gate, false = force free) |
| **B-4** | **Free tier member threshold configurable** via app setting (`free_tier_member_limit`, default: 3) | The "3 members free" limit may need adjustment without code changes | SuperAdmin can change the threshold; value consumed by pay gate logic in PRD 75 |

### Section C: Database Schema — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **`league_subscriptions` table exists** with columns: `id`, `league_id` (FK), `tier_id` (FK), `status` (enum: active, past_due, canceled, trialing, paused), `billing_interval` (monthly/annual), `current_period_start`, `current_period_end`, `external_subscription_id` (provider reference), `external_customer_id`, `pay_gate_override` (nullable boolean), `metadata` (JSONB), `created_at`, `updated_at` | No way to track which league is on which tier | Table created via migration; each league can have at most one active subscription |
| **C-2** | **`payment_history` table exists** with columns: `id`, `league_subscription_id` (FK), `amount_cents`, `currency`, `status` (succeeded/failed/refunded/pending), `external_payment_id`, `external_invoice_id`, `payment_method_summary` (e.g., "Visa ending 4242"), `failure_reason`, `metadata` (JSONB), `created_at` | No audit trail for payments | Table created via migration; supports querying payment history per league |
| **C-3** | **RLS policies** — SuperAdmin can read/write all subscription data; league owners can read their own league's subscription and payment history; regular members cannot access billing data | Billing data is sensitive and must be access-controlled | RLS policies applied; tested via Supabase MCP or integration tests |
| **C-4** | **Provider-agnostic schema** — `external_subscription_id`, `external_customer_id`, `external_payment_id` columns store provider references without coupling to a specific provider | PRD 72 selects the provider, but schema must survive a provider switch | Column names use `external_` prefix, not provider-specific names (not `stripe_id`) |
| **C-5** | **Indexes on hot query paths** — `league_subscriptions(league_id)`, `league_subscriptions(status)`, `payment_history(league_subscription_id)`, `subscription_tiers(is_active, sort_order)` | Subscription lookups happen on every league page load when pay gate is active | Indexes created in migration; query plan shows index scans |

### Section D: SuperAdmin UI — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Tier Management page** at `/admin/subscription-tiers` — lists all tiers in a table with inline edit capability | SuperAdmin has no way to view or modify tier configuration | Page renders tier table with all fields; registered in `adminPages.ts`; accessible from admin nav |
| **D-2** | **Create/Edit Tier form** — validates required fields, previews monthly/annual price display, enforces unique slug | SuperAdmin needs to add new tiers or modify existing ones | Form uses shadcn/ui components, validates inputs (positive prices, non-empty name), saves via API |
| **D-3** | **Pay Gate Toggle section** on the tier management page — shows global toggle and free tier threshold | SuperAdmin needs a single place to control billing activation | Toggle switch for `pay_gate_enabled` and `pay_gate_global`; number input for `free_tier_member_limit` |
| **D-4** | **Design system compliant** — dark mode, light mode, CSS variables, mobile-first responsive layout | UI must match existing admin pages visually | Renders correctly in both themes; no hardcoded colors; usable on mobile viewports |
| **D-5** | **Confirmation dialogs for destructive actions** — deactivating a tier shows how many active leagues use it | Accidental tier deactivation could confuse league owners mid-subscription | Deactivate button shows "X leagues currently on this tier" before confirming |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Tables created | 3 tables (`subscription_tiers`, `league_subscriptions`, `payment_history`) | `SELECT table_name FROM information_schema.tables` via Supabase MCP |
| Default tiers seeded | 4 tiers (Free, Standard, Premium, Enterprise) | `SELECT count(*) FROM subscription_tiers` returns 4 |
| Tier CRUD works | SuperAdmin can create, read, update, deactivate tiers | Manual test via SuperAdmin UI |
| Pay gate toggle works | Global toggle and per-league override function correctly | `useFeatureFlag('pay_gate_enabled')` and `useAppSettings()` return expected values |
| Free tier threshold configurable | Value changeable from SuperAdmin UI | Change threshold, verify value persists on page reload |
| TypeScript passes | Zero type errors | `npx tsc --noEmit` exit code 0 |
| Tests pass | All existing + new tests pass | `npx vitest run` exit code 0 |
| RLS policies enforced | Non-admin users cannot access other leagues' billing data | Query with non-admin client returns only own league data |
| Dark/light mode | Admin UI renders correctly in both themes | Visual inspection in both modes |
| Mobile responsive | Tier management page usable on 375px viewport | Visual inspection on mobile viewport |
| Provider-agnostic | No provider-specific column names in schema | Schema review confirms `external_` prefix convention |

---

## 🔍 Systems/Design Considerations

1. **Provider Abstraction Layer** — The schema deliberately uses `external_*` column names rather than provider-specific ones (e.g., `stripe_subscription_id`). This means PRD 76 can implement against any provider selected in PRD 72 without schema changes. If the provider changes later, only the integration code changes — not the database.

2. **Settings Cascade Integration** — The pay gate toggle follows the existing SuperAdmin settings pattern (PRD 26): a global value in `site_settings` consumed via `useAppSettings()`, with per-league overrides stored in `league_subscriptions.pay_gate_override`. This mirrors how other platform settings cascade from global to league-specific.

3. **Pricing Page Transition** — The current static pricing page (PRD 33) hardcodes tier information. After this PRD, the pricing page should fetch tiers from the database so SuperAdmin changes are reflected immediately. This transition can happen in PRD 75 or as a small follow-up, but the schema must support it from day one.

4. **Cents-Based Currency** — Storing prices in cents (integer) is a deliberate choice to avoid floating-point arithmetic in billing. The UI layer handles display formatting (`$4.99`), and all server-side calculations use integer math. This is industry standard for billing systems.

---

## 💡 Proactive Considerations

| # | Consideration | Why It Matters |
|---|---------------|----------------|
| 1 | **Grandfathering prep for PRD 76** — The `league_subscriptions` table includes `metadata` JSONB and `status` enum values that support grandfathering. When a tier's price increases, existing subscribers can be flagged in metadata (`{"grandfathered_price_cents": 499}`) and honored at their original rate. Design the schema now so PRD 76 does not need a migration to support this. |
| 2 | **Multi-currency readiness** — While StepLeague launches with USD pricing, the schema stores `currency` on `payment_history` and prices in cents. Adding multi-currency support later requires adding a `currency` column to `subscription_tiers` (or a separate `tier_prices` table for per-currency pricing). The current design does not block this path. Document the extension point. |
| 3 | **Trial period support** — The `league_subscriptions.status` enum includes `trialing`. The schema should also include `trial_ends_at` (nullable timestamp) so PRD 76 can implement "7-day free trial" without a migration. Add this column now even though PRD 74 does not activate trials. |
| 4 | **Grace period for failed payments** — The `past_due` status in `league_subscriptions` enables grace periods. Add a `grace_period_days` column to `subscription_tiers` (default: 7) so SuperAdmin can configure how long a league retains access after a payment fails. PRD 76 consumes this value. |
| 5 | **Audit trail completeness** — `payment_history` captures every transaction, but tier configuration changes also need auditing. Add `updated_by` (user ID) to `subscription_tiers` so SuperAdmin changes are attributable. Consider whether a separate `tier_change_log` table is warranted or if Supabase's built-in audit log suffices. |
| 6 | **Webhook schema prep** — The `external_*` columns on `league_subscriptions` and `payment_history` are designed to store webhook payload references. Add a `webhook_events` table (or JSONB log) so PRD 76 can store raw webhook payloads for debugging and reconciliation. Even if not built now, reserve the table name in the migration plan. |
| 7 | **Feature flag for gradual rollout** — The `pay_gate_enabled` feature flag allows launching the tier system to a percentage of users or specific leagues before going global. This supports A/B testing the pay gate impact on engagement. Ensure the feature flag integrates with the existing feature flag system (not a separate mechanism). |
| 8 | **Migration path from free-only** — Every existing league is implicitly on the Free tier. When pay gate activates, all leagues without a `league_subscriptions` row should be treated as Free tier (not blocked). The absence of a subscription row means "free" — not "unknown." Document this convention so PRD 75 gate logic handles it correctly without requiring a backfill migration. |

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 74 as Proposed in Sprint F, update total count
- [ ] CHANGELOG.md — Log PRD 74 creation
- [ ] docs/DATABASE_SCHEMA.md — Add `subscription_tiers`, `league_subscriptions`, `payment_history` table documentation
- [ ] `src/lib/adminPages.ts` — Register `/admin/subscription-tiers` in admin nav
- [ ] No AGENTS.md changes needed (no new code patterns beyond existing conventions)
- [ ] **Git commit** — `docs(prd): PRD 74 — pay gate schema and config`

---

## 📚 Best Practice References

- **Cents-based pricing:** Store monetary values as integers in the smallest currency unit (cents for USD) to avoid floating-point errors. Industry standard used by Stripe, Paddle, and every major billing system.
- **Provider-agnostic schema:** Use generic column names (`external_subscription_id`) rather than provider-specific ones. This pattern is recommended by billing system architects to reduce migration cost when switching providers.
- **Soft-delete for billing entities:** Never hard-delete tiers or subscriptions. Use status flags (`is_active`, `status: canceled`) to preserve referential integrity and audit trails.
- **JSONB for extensibility:** Use JSONB columns (`features`, `metadata`) for data that varies per row or may expand without schema changes. Avoid over-normalizing early — JSONB is appropriate for feature flags and provider-specific metadata.
- **Subscription status machine:** Model subscription lifecycle as a state machine (active -> past_due -> canceled, active -> paused -> active, trialing -> active). Define valid transitions so application code can enforce them.
- **RLS for multi-tenant billing:** Supabase RLS ensures league owners see only their own billing data. SuperAdmin bypasses RLS via `adminClient`. This is the standard pattern for multi-tenant SaaS on Supabase.

---

## 🔗 Related Documents

- [PRD 25: User Preferences](./PRD_25_User_Preferences.md) — Settings architecture and `useAppSettings` pattern
- [PRD 26: SuperAdmin Settings](./PRD_26_SuperAdmin_Settings.md) — SuperAdmin settings system, feature flags, settings cascade
- [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md) — Pricing tier definitions and freemium model
- [PRD 72: Payment Provider Research](./PRD_72_Payment_Provider_Research.md) — Payment provider selection (must be completed first)
- PRD 75: Pay Gate UI (future) — Blocked by this PRD; renders gate components using tier data from this schema
- PRD 76: Subscriptions (future) — Blocked by this PRD; processes payments and manages subscription lifecycle

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD — pay gate schema, tier configuration, and SuperAdmin controls |
