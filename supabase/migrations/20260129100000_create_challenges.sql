-- Migration: Create challenges table for PRD-54 Friend-Specific Challenges
-- This table stores 1v1 challenges between users
--
-- Systems Thinking:
-- - Challenges are state-machine driven (pending → accepted/declined → completed/cancelled)
-- - Both challenger and target must be valid users
-- - Supports metric type flexibility (steps, calories, etc.)
-- - Integrates with notification infrastructure (PRD-38)

-- ============================================================================
-- Create challenges table
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Challenge configuration
  metric_type VARCHAR(20) DEFAULT 'steps',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Results (populated during and after challenge)
  challenger_value INTEGER DEFAULT 0,
  target_value INTEGER DEFAULT 0,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- State management
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,  -- Optional message from challenger

  -- Template info (PRD-54 P-1: Challenge Templates)
  template_id VARCHAR(50),  -- e.g., 'weekend_warrior', 'week_sprint'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled', 'expired')),
  CONSTRAINT valid_metric_type CHECK (metric_type IN ('steps', 'calories', 'slp', 'distance', 'swimming', 'cycling', 'running')),
  CONSTRAINT different_users CHECK (challenger_id != target_id),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Challenger's challenges (sent)
CREATE INDEX idx_challenges_challenger ON challenges(challenger_id, status, created_at DESC);

-- Target's challenges (received)
CREATE INDEX idx_challenges_target ON challenges(target_id, status, created_at DESC);

-- Pending challenges for target (accept/decline needed)
CREATE INDEX idx_challenges_pending ON challenges(target_id, created_at DESC)
  WHERE status = 'pending';

-- Active challenges (for progress tracking and resolution)
CREATE INDEX idx_challenges_active ON challenges(period_end, status)
  WHERE status = 'accepted';

-- User's active challenge with specific opponent (prevent duplicates)
CREATE INDEX idx_challenges_unique_active ON challenges(challenger_id, target_id, status)
  WHERE status IN ('pending', 'accepted');

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Users can view challenges they're involved in
CREATE POLICY "Users can view their challenges"
  ON challenges
  FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = target_id);

-- Users can create challenges (as challenger)
CREATE POLICY "Users can create challenges"
  ON challenges
  FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

-- Users can update challenges they're involved in (accept/decline/cancel)
CREATE POLICY "Users can update their challenges"
  ON challenges
  FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = target_id);

-- Only challengers can delete their pending challenges
CREATE POLICY "Challengers can delete pending challenges"
  ON challenges
  FOR DELETE
  USING (auth.uid() = challenger_id AND status = 'pending');

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to get active challenge between two users
CREATE OR REPLACE FUNCTION get_active_challenge(p_user1 UUID, p_user2 UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge_id UUID;
BEGIN
  SELECT id INTO v_challenge_id
  FROM challenges
  WHERE status IN ('pending', 'accepted')
    AND (
      (challenger_id = p_user1 AND target_id = p_user2)
      OR (challenger_id = p_user2 AND target_id = p_user1)
    )
  LIMIT 1;

  RETURN v_challenge_id;
END;
$$;

-- Function to calculate challenge results from submissions
CREATE OR REPLACE FUNCTION calculate_challenge_result(p_challenge_id UUID)
RETURNS TABLE(
  challenger_total INTEGER,
  target_total INTEGER,
  winner_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge challenges%ROWTYPE;
  v_challenger_total INTEGER := 0;
  v_target_total INTEGER := 0;
  v_winner UUID;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM challenges
  WHERE id = p_challenge_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate challenger's total (dedupe by date, take highest)
  WITH deduped AS (
    SELECT DISTINCT ON (for_date) steps
    FROM submissions
    WHERE user_id = v_challenge.challenger_id
      AND for_date >= v_challenge.period_start
      AND for_date <= v_challenge.period_end
    ORDER BY for_date, steps DESC
  )
  SELECT COALESCE(SUM(steps), 0) INTO v_challenger_total FROM deduped;

  -- Calculate target's total (dedupe by date, take highest)
  WITH deduped AS (
    SELECT DISTINCT ON (for_date) steps
    FROM submissions
    WHERE user_id = v_challenge.target_id
      AND for_date >= v_challenge.period_start
      AND for_date <= v_challenge.period_end
    ORDER BY for_date, steps DESC
  )
  SELECT COALESCE(SUM(steps), 0) INTO v_target_total FROM deduped;

  -- Determine winner
  IF v_challenger_total > v_target_total THEN
    v_winner := v_challenge.challenger_id;
  ELSIF v_target_total > v_challenger_total THEN
    v_winner := v_challenge.target_id;
  ELSE
    v_winner := NULL;  -- Tie
  END IF;

  RETURN QUERY SELECT v_challenger_total, v_target_total, v_winner;
END;
$$;

-- Function to resolve a challenge (called by cron or manually)
CREATE OR REPLACE FUNCTION resolve_challenge(p_challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Calculate result
  SELECT * INTO v_result
  FROM calculate_challenge_result(p_challenge_id);

  IF v_result IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update challenge
  UPDATE challenges
  SET
    challenger_value = v_result.challenger_total,
    target_value = v_result.target_total,
    winner_id = v_result.winner_id,
    status = 'completed',
    resolved_at = NOW()
  WHERE id = p_challenge_id
    AND status = 'accepted';

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- Add notification types for challenges
-- ============================================================================

INSERT INTO notification_types (id, name, category, description, supports_email, supports_push, supports_in_app) VALUES
  ('challenge_received', 'Challenge Received', 'social', 'Someone challenged you to a competition', true, true, true),
  ('challenge_accepted', 'Challenge Accepted', 'social', 'Your challenge was accepted', false, true, true),
  ('challenge_declined', 'Challenge Declined', 'social', 'Your challenge was declined', false, false, true),
  ('challenge_result', 'Challenge Result', 'achievement', 'A challenge has been completed', true, true, true),
  ('challenge_reminder', 'Challenge Reminder', 'engagement', 'Reminder about an active challenge', false, true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Challenge templates configuration (stored as global setting)
-- ============================================================================

INSERT INTO notification_settings_global (notification_type_id, enabled, settings) VALUES
  ('challenge_received', true, '{}'),
  ('challenge_accepted', true, '{}'),
  ('challenge_result', true, '{}')
ON CONFLICT (notification_type_id) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE challenges IS 'Friend-specific challenges for 1v1 competitions (PRD-54)';
COMMENT ON COLUMN challenges.status IS 'Challenge state: pending, accepted, declined, completed, cancelled, expired';
COMMENT ON COLUMN challenges.challenger_id IS 'User who initiated the challenge';
COMMENT ON COLUMN challenges.target_id IS 'User who was challenged';
COMMENT ON COLUMN challenges.metric_type IS 'Type of metric being compared: steps, calories, etc.';
COMMENT ON COLUMN challenges.template_id IS 'Optional challenge template ID (weekend_warrior, week_sprint, etc.)';
COMMENT ON COLUMN challenges.winner_id IS 'User who won (NULL for tie or incomplete)';
COMMENT ON FUNCTION get_active_challenge IS 'Returns active challenge ID between two users, if any';
COMMENT ON FUNCTION calculate_challenge_result IS 'Calculates totals and winner for a challenge';
COMMENT ON FUNCTION resolve_challenge IS 'Resolves a completed challenge, updating values and winner';
