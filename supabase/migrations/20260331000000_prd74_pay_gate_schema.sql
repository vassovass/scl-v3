-- PRD 74: Pay Gate Schema & Config
-- Creates subscription_tiers, league_subscriptions, payment_history tables.
-- Adds pay_gate_override to leagues table.
-- Adds feature flags and app settings for pay gate control.
-- Provider-agnostic schema: external_* columns work with Paystack, Paddle, or Stripe.

-- ============================================================================
-- 1. subscription_tiers
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT        NOT NULL UNIQUE,
  name                 TEXT        NOT NULL,
  description          TEXT,
  monthly_price_cents  INTEGER     NOT NULL DEFAULT 0,   -- $4.99 stored as 499
  annual_price_cents   INTEGER     NOT NULL DEFAULT 0,   -- $49.00 stored as 4900
  member_limit         INTEGER,                          -- NULL = unlimited
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  sort_order           INTEGER     NOT NULL DEFAULT 0,
  features             JSONB       NOT NULL DEFAULT '{}', -- e.g. {"analytics": true}
  grace_period_days    INTEGER     NOT NULL DEFAULT 7,    -- days access continues after failed payment
  updated_by           UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscription_tiers IS 'SuperAdmin-configurable pricing tiers for the freemium model. PRD 74.';
COMMENT ON COLUMN subscription_tiers.member_limit IS 'NULL = unlimited (Enterprise). Positive integer for capped tiers.';
COMMENT ON COLUMN subscription_tiers.grace_period_days IS 'Days of continued access after a payment fails before downgrade. Configurable per tier.';
COMMENT ON COLUMN subscription_tiers.features IS 'Per-tier feature flags as JSONB. Keys match platform feature identifiers.';

-- Index: hot query for pricing page (active tiers, ordered)
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active_sort
  ON subscription_tiers(is_active, sort_order);

-- RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read active tiers for the pricing page
DROP POLICY IF EXISTS "Public read active tiers" ON subscription_tiers;
CREATE POLICY "Public read active tiers" ON subscription_tiers
  FOR SELECT
  USING (is_active = true);

-- SuperAdmin full access (read inactive tiers, create, update — no hard delete)
DROP POLICY IF EXISTS "SuperAdmin full access tiers" ON subscription_tiers;
CREATE POLICY "SuperAdmin full access tiers" ON subscription_tiers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- ============================================================================
-- 2. league_subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS league_subscriptions (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id                UUID        NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  tier_id                  UUID        NOT NULL REFERENCES subscription_tiers(id) ON DELETE RESTRICT,
  status                   TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'paused')),
  billing_interval         TEXT        NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'annual')),
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  trial_ends_at            TIMESTAMPTZ,                  -- NULL if no trial; prepped for PRD 76
  external_subscription_id TEXT,                         -- Paystack: SUB_xxx / Paddle: sub_xxx
  external_customer_id     TEXT,                         -- Paystack: CUS_xxx / Paddle: ctm_xxx
  metadata                 JSONB       NOT NULL DEFAULT '{}', -- provider-specific data, grandfathering flags
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE league_subscriptions IS 'Per-league subscription state. One active row per league. PRD 74.';
COMMENT ON COLUMN league_subscriptions.external_subscription_id IS 'Provider subscription reference (Paystack SUB_xxx, Paddle sub_xxx). No provider-specific column names.';
COMMENT ON COLUMN league_subscriptions.trial_ends_at IS 'NULL = no trial. Set by PRD 76 when trialing status is used.';
COMMENT ON COLUMN league_subscriptions.metadata IS 'Provider-specific data and grandfathering info. e.g. {"grandfathered_price_cents": 499, "paystack_plan_code": "PLN_xxx"}.';

-- Enforce: at most one active/trialing/past_due subscription per league
CREATE UNIQUE INDEX IF NOT EXISTS idx_league_subscriptions_one_active
  ON league_subscriptions(league_id)
  WHERE status IN ('active', 'trialing', 'past_due');

-- Indexes: hot query paths
CREATE INDEX IF NOT EXISTS idx_league_subscriptions_league_id
  ON league_subscriptions(league_id);
CREATE INDEX IF NOT EXISTS idx_league_subscriptions_status
  ON league_subscriptions(status);

-- RLS
ALTER TABLE league_subscriptions ENABLE ROW LEVEL SECURITY;

-- SuperAdmin full access
DROP POLICY IF EXISTS "SuperAdmin full access league_subscriptions" ON league_subscriptions;
CREATE POLICY "SuperAdmin full access league_subscriptions" ON league_subscriptions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- League owners can read their own league's subscription
DROP POLICY IF EXISTS "League owners read own subscription" ON league_subscriptions;
CREATE POLICY "League owners read own subscription" ON league_subscriptions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM leagues
    WHERE leagues.id = league_subscriptions.league_id
      AND leagues.owner_id = auth.uid()
      AND leagues.deleted_at IS NULL
  ));

-- ============================================================================
-- 3. payment_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_history (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  league_subscription_id  UUID        NOT NULL REFERENCES league_subscriptions(id) ON DELETE CASCADE,
  amount_cents            INTEGER     NOT NULL,
  currency                TEXT        NOT NULL DEFAULT 'USD',
  status                  TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('succeeded', 'failed', 'refunded', 'pending')),
  external_payment_id     TEXT,                         -- Paystack transaction ref / Paddle txn ID
  external_invoice_id     TEXT,                         -- Paystack invoice / Paddle invoice
  payment_method_summary  TEXT,                         -- e.g. "Visa ending 4242"
  failure_reason          TEXT,                         -- populated on failed/declined payments
  metadata                JSONB       NOT NULL DEFAULT '{}', -- raw webhook payload reference, etc.
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payment_history IS 'Immutable audit trail of all payment events per league subscription. PRD 74.';

-- Index: hot query path
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription
  ON payment_history(league_subscription_id);

-- RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- SuperAdmin full access
DROP POLICY IF EXISTS "SuperAdmin full access payment_history" ON payment_history;
CREATE POLICY "SuperAdmin full access payment_history" ON payment_history
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- League owners can read their own payment history
DROP POLICY IF EXISTS "League owners read own payment history" ON payment_history;
CREATE POLICY "League owners read own payment history" ON payment_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM league_subscriptions ls
    JOIN leagues l ON l.id = ls.league_id
    WHERE ls.id = payment_history.league_subscription_id
      AND l.owner_id = auth.uid()
      AND l.deleted_at IS NULL
  ));

-- ============================================================================
-- 4. Add pay_gate_override to leagues table
-- ============================================================================
-- NULL  = follow the global pay_gate_global setting
-- true  = force pay gate on for this league regardless of global setting
-- false = force free tier for this league regardless of global setting (sponsored, grandfathered, etc.)

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS pay_gate_override BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN leagues.pay_gate_override IS 'Per-league pay gate override. NULL=follow global, true=force gate on, false=force free. PRD 74.';

-- ============================================================================
-- 5. Seed default subscription tiers
-- ============================================================================
-- Prices in cents: $4.99 = 499, $9.99 = 999, $49.00 = 4900, $99.00 = 9900
-- Enterprise: contact us (price = 0, member_limit = NULL)

INSERT INTO subscription_tiers (slug, name, description, monthly_price_cents, annual_price_cents, member_limit, is_active, sort_order, features, grace_period_days)
VALUES
  (
    'free',
    'Free',
    'Everything you need to start competing. No credit card required.',
    0, 0, 3, true, 0,
    '{"step_tracking": true, "leaderboards": true, "public_profile": true}'::jsonb,
    0
  ),
  (
    'standard',
    'Standard',
    'For growing groups who want more members and deeper insights.',
    499, 4900, 10, true, 1,
    '{"step_tracking": true, "leaderboards": true, "public_profile": true, "analytics": true, "custom_goals": true}'::jsonb,
    7
  ),
  (
    'premium',
    'Premium',
    'Full-featured for serious competitors and office teams.',
    999, 9900, 25, true, 2,
    '{"step_tracking": true, "leaderboards": true, "public_profile": true, "analytics": true, "custom_goals": true, "priority_support": true, "challenges": true, "privacy_mode": true}'::jsonb,
    7
  ),
  (
    'enterprise',
    'Enterprise',
    'Custom solutions for large organisations. Contact us to get started.',
    0, 0, NULL, true, 3,
    '{"step_tracking": true, "leaderboards": true, "public_profile": true, "analytics": true, "custom_goals": true, "priority_support": true, "challenges": true, "privacy_mode": true, "dedicated_support": true, "api_access": true, "custom_branding": true}'::jsonb,
    14
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 6. App settings: pay gate feature flags and config
-- ============================================================================

-- Feature flags
INSERT INTO app_settings (key, value, label, description, category, value_type, visible_to, editable_by)
VALUES
  (
    'feature_pay_gate',
    'false',
    'Pay Gate Feature',
    'Master switch: enables the entire pay gate system. When false, all leagues behave as free tier regardless of subscription status (PRD 74).',
    'features',
    'boolean',
    '{superadmin}',
    '{superadmin}'
  ),
  (
    'pay_gate_global',
    'false',
    'Global Pay Gate',
    'When enabled, all leagues without an active paid subscription are subject to pay gate enforcement. Requires feature_pay_gate to also be true (PRD 74).',
    'features',
    'boolean',
    '{superadmin}',
    '{superadmin}'
  )
ON CONFLICT (key) DO NOTHING;

-- Configurable limit
INSERT INTO app_settings (key, value, label, description, category, value_type, value_constraints, visible_to, editable_by)
VALUES
  (
    'free_tier_member_limit',
    '3',
    'Free Tier Member Limit',
    'Maximum number of members allowed in a league on the free tier. Leagues exceeding this limit see the pay gate when joining or inviting (PRD 74).',
    'limits',
    'number',
    '{"min": 1, "max": 100}'::jsonb,
    '{superadmin}',
    '{superadmin}'
  )
ON CONFLICT (key) DO NOTHING;
