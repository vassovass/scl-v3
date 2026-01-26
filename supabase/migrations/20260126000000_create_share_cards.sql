-- Migration: Create share_cards table for PRD-51 Social Sharing
-- This table stores persistent share cards for tracking and re-sharing

-- ============================================================================
-- Create Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS share_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(8) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Card content
  card_type VARCHAR(50) NOT NULL,
  metric_type VARCHAR(20) DEFAULT 'steps',
  metric_value INTEGER NOT NULL,

  -- Context
  period_start DATE,
  period_end DATE,
  period_label VARCHAR(50),
  league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
  league_name VARCHAR(255),
  rank INTEGER,
  improvement_pct INTEGER,
  custom_message TEXT,
  theme VARCHAR(20) DEFAULT 'dark',

  -- Analytics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares_completed INTEGER DEFAULT 0,

  -- Constraints
  CONSTRAINT valid_card_type CHECK (card_type IN ('daily', 'weekly', 'personal_best', 'streak', 'rank', 'challenge', 'rank_change')),
  CONSTRAINT valid_metric_type CHECK (metric_type IN ('steps', 'calories', 'slp', 'distance', 'swimming', 'cycling', 'running')),
  CONSTRAINT valid_theme CHECK (theme IN ('light', 'dark'))
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Short code lookups (most common query)
CREATE INDEX idx_share_cards_short_code ON share_cards(short_code);

-- User's share history
CREATE INDEX idx_share_cards_user_id ON share_cards(user_id);

-- Recent shares (for dashboard)
CREATE INDEX idx_share_cards_created_at ON share_cards(created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE share_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can view share cards (they're meant to be public)
CREATE POLICY "Share cards are publicly viewable"
  ON share_cards
  FOR SELECT
  USING (true);

-- Users can create their own share cards
CREATE POLICY "Users can create their own share cards"
  ON share_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own share cards
CREATE POLICY "Users can update their own share cards"
  ON share_cards
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own share cards
CREATE POLICY "Users can delete their own share cards"
  ON share_cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Function to increment view count (bypasses RLS for public access)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_share_card_views(card_short_code VARCHAR(8))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE share_cards
  SET views = views + 1
  WHERE short_code = card_short_code;
END;
$$;

-- ============================================================================
-- Function to increment click count (bypasses RLS for public access)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_share_card_clicks(card_short_code VARCHAR(8))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE share_cards
  SET clicks = clicks + 1
  WHERE short_code = card_short_code;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE share_cards IS 'Persistent share cards for social sharing (PRD-51)';
COMMENT ON COLUMN share_cards.short_code IS 'Short URL code (e.g., xK7mN2pQ) for /s/[code]';
COMMENT ON COLUMN share_cards.card_type IS 'Type of card: daily, weekly, personal_best, streak, rank, challenge, rank_change';
COMMENT ON COLUMN share_cards.metric_type IS 'Type of metric: steps, calories, slp, distance, etc.';
COMMENT ON COLUMN share_cards.views IS 'Number of times the share page was viewed';
COMMENT ON COLUMN share_cards.clicks IS 'Number of times CTA was clicked';
COMMENT ON COLUMN share_cards.shares_completed IS 'Number of times share was completed';
