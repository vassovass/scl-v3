-- PRD 25: User Preferences System
-- Create table for user-specific preferences with default/override pattern

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Navigation preferences
  default_landing TEXT DEFAULT 'dashboard' CHECK (default_landing IN ('dashboard', 'submit', 'progress', 'rankings')),
  primary_league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,

  -- Reminder preferences
  reminder_style TEXT DEFAULT 'floating' CHECK (reminder_style IN ('floating', 'badge', 'card')),
  reminder_dismissed_until TIMESTAMPTZ,

  -- Theme preferences (future-ready)
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),

  -- Notification preferences (future-ready)
  email_daily_reminder BOOLEAN DEFAULT false,
  email_weekly_digest BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function for updating updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE TRIGGER update_user_preferences_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster primary_league_id lookups
CREATE INDEX idx_user_preferences_primary_league ON user_preferences(primary_league_id) WHERE primary_league_id IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE user_preferences IS 'PRD 25: User-specific preferences following default/override pattern';
COMMENT ON COLUMN user_preferences.default_landing IS 'Page to navigate to after login';
COMMENT ON COLUMN user_preferences.primary_league_id IS 'Default league for quick actions';
COMMENT ON COLUMN user_preferences.reminder_style IS 'How to display step submission reminders';
COMMENT ON COLUMN user_preferences.theme IS 'UI theme preference (light/dark/system)';
