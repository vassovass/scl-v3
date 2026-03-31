-- PRD 76: Subscription Management & Grandfathering
-- Adds price_locked_at_cents, canceled_at to league_subscriptions.
-- Adds 'expired' to status check constraint.
-- Creates subscription_events table for lifecycle audit log.
-- Creates webhook_events table for dead letter logging.

-- ============================================================================
-- 1. Add new columns to league_subscriptions
-- ============================================================================

ALTER TABLE league_subscriptions
  ADD COLUMN IF NOT EXISTS price_locked_at_cents INTEGER,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

COMMENT ON COLUMN league_subscriptions.price_locked_at_cents IS 'Grandfathered price locked at subscription creation. Renewals honor this, not current tier price. PRD 76.';
COMMENT ON COLUMN league_subscriptions.canceled_at IS 'When the user requested cancellation. Access continues until current_period_end. PRD 76.';

-- ============================================================================
-- 2. Update status check constraint to include 'expired'
-- ============================================================================

-- Drop the old constraint and recreate with 'expired' added
ALTER TABLE league_subscriptions
  DROP CONSTRAINT IF EXISTS league_subscriptions_status_check;

ALTER TABLE league_subscriptions
  ADD CONSTRAINT league_subscriptions_status_check
    CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'paused', 'expired'));

-- ============================================================================
-- 3. subscription_events — lifecycle audit log
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  league_subscription_id  UUID        NOT NULL REFERENCES league_subscriptions(id) ON DELETE CASCADE,
  from_status             TEXT,                            -- NULL for initial creation
  to_status               TEXT        NOT NULL,
  reason                  TEXT,                            -- human-readable reason for the transition
  metadata                JSONB       NOT NULL DEFAULT '{}', -- tier change details, proration amounts, etc.
  triggered_by            TEXT        NOT NULL DEFAULT 'system', -- 'user:<id>', 'system', 'webhook', 'admin:<id>'
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscription_events IS 'Immutable audit log of every subscription state transition. PRD 76.';
COMMENT ON COLUMN subscription_events.triggered_by IS 'Who caused the transition: user:<id>, system, webhook, admin:<id>.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription
  ON subscription_events(league_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created
  ON subscription_events(created_at);

-- RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- SuperAdmin full access
DROP POLICY IF EXISTS "SuperAdmin full access subscription_events" ON subscription_events;
CREATE POLICY "SuperAdmin full access subscription_events" ON subscription_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- League owners can read their own subscription events
DROP POLICY IF EXISTS "League owners read own subscription events" ON subscription_events;
CREATE POLICY "League owners read own subscription events" ON subscription_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM league_subscriptions ls
    JOIN leagues l ON l.id = ls.league_id
    WHERE ls.id = subscription_events.league_subscription_id
      AND l.owner_id = auth.uid()
      AND l.deleted_at IS NULL
  ));

-- ============================================================================
-- 4. webhook_events — dead letter log for raw webhook payloads
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT        NOT NULL DEFAULT 'paystack',
  event_id     TEXT,                                       -- provider's unique event ID
  event_type   TEXT,                                       -- e.g. 'charge.success'
  payload      JSONB       NOT NULL DEFAULT '{}',          -- raw webhook payload
  processed_at TIMESTAMPTZ,                                -- NULL if not yet processed
  error        TEXT,                                       -- error message if processing failed
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE webhook_events IS 'Dead letter log for all incoming webhook payloads. Enables debugging and reconciliation. PRD 76.';

-- Index for idempotency checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_event_id
  ON webhook_events(provider, event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_events_created
  ON webhook_events(created_at);

-- RLS — SuperAdmin only
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin full access webhook_events" ON webhook_events;
CREATE POLICY "SuperAdmin full access webhook_events" ON webhook_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));
