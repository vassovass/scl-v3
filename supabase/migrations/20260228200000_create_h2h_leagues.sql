-- =============================================================================
-- PRD 47: Head-to-Head League Mode (FPL Style)
-- Purpose: Schema for weekly 1v1 matchups with season standings
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. H2H SEASONS
-- -----------------------------------------------------------------------------
CREATE TABLE h2h_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL DEFAULT 1,
  season_type TEXT NOT NULL DEFAULT 'fixed' CHECK (season_type IN ('fixed', 'endless')),
  total_weeks INTEGER NOT NULL DEFAULT 12 CHECK (total_weeks >= 1),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(league_id, season_number)
);

CREATE INDEX idx_h2h_seasons_league ON h2h_seasons(league_id);
CREATE INDEX idx_h2h_seasons_status ON h2h_seasons(status) WHERE status = 'active';

-- -----------------------------------------------------------------------------
-- 2. H2H FIXTURES (Weekly matchups)
-- -----------------------------------------------------------------------------
CREATE TABLE h2h_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES h2h_seasons(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  round_type TEXT NOT NULL DEFAULT 'regular' CHECK (round_type IN ('regular', 'semifinal', 'final')),
  home_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  away_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  home_steps INTEGER,
  away_steps INTEGER,
  home_points INTEGER CHECK (home_points IN (0, 1, 3)),
  away_points INTEGER CHECK (away_points IN (0, 1, 3)),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user plays once per week per season (for regular rounds)
  UNIQUE(season_id, week_number, home_user_id)
);

CREATE INDEX idx_h2h_fixtures_season_week ON h2h_fixtures(season_id, week_number);
CREATE INDEX idx_h2h_fixtures_home ON h2h_fixtures(home_user_id);
CREATE INDEX idx_h2h_fixtures_away ON h2h_fixtures(away_user_id);
CREATE INDEX idx_h2h_fixtures_status ON h2h_fixtures(status) WHERE status IN ('scheduled', 'in_progress');

-- -----------------------------------------------------------------------------
-- 3. H2H STANDINGS (Season leaderboard)
-- -----------------------------------------------------------------------------
CREATE TABLE h2h_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES h2h_seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  drawn INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  total_steps BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(season_id, user_id)
);

CREATE INDEX idx_h2h_standings_season_rank ON h2h_standings(season_id, points DESC, total_steps DESC);

-- -----------------------------------------------------------------------------
-- 4. LEAGUE EXTENSIONS
-- -----------------------------------------------------------------------------
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS h2h_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS h2h_season_weeks INTEGER DEFAULT 12;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE h2h_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE h2h_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE h2h_standings ENABLE ROW LEVEL SECURITY;

-- League members can view seasons
CREATE POLICY h2h_seasons_member_read ON h2h_seasons
  FOR SELECT USING (
    league_id IN (SELECT league_id FROM memberships WHERE user_id = auth.uid())
  );

-- League members can view fixtures
CREATE POLICY h2h_fixtures_member_read ON h2h_fixtures
  FOR SELECT USING (
    season_id IN (
      SELECT id FROM h2h_seasons
      WHERE league_id IN (SELECT league_id FROM memberships WHERE user_id = auth.uid())
    )
  );

-- League members can view standings
CREATE POLICY h2h_standings_member_read ON h2h_standings
  FOR SELECT USING (
    season_id IN (
      SELECT id FROM h2h_seasons
      WHERE league_id IN (SELECT league_id FROM memberships WHERE user_id = auth.uid())
    )
  );

-- Superadmins can manage all H2H data
CREATE POLICY h2h_seasons_admin ON h2h_seasons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY h2h_fixtures_admin ON h2h_fixtures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY h2h_standings_admin ON h2h_standings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  );

-- -----------------------------------------------------------------------------
-- FEATURE FLAG
-- -----------------------------------------------------------------------------
INSERT INTO app_settings (key, value, label, description, category, value_type, visible_to, editable_by)
VALUES
  ('feature_h2h_leagues', 'false', 'Head-to-Head Leagues', 'Enable FPL-style weekly 1v1 matchups in leagues (PRD 47)', 'features', 'boolean', '{superadmin}', '{superadmin}')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- TABLE COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE h2h_seasons IS 'PRD 47: H2H league seasons — fixed-length or endless round-robin competition';
COMMENT ON TABLE h2h_fixtures IS 'PRD 47: Weekly 1v1 matchups with step comparison and point awards (3/1/0)';
COMMENT ON TABLE h2h_standings IS 'PRD 47: Season leaderboard ranked by points then total steps';
COMMENT ON COLUMN h2h_fixtures.round_type IS 'regular = round-robin, semifinal/final = playoff rounds';
COMMENT ON COLUMN h2h_seasons.season_type IS 'fixed = set number of weeks, endless = continuous random pairing';
