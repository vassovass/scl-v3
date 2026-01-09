-- PRD 26: SuperAdmin Settings & Feature Flags
-- Adds all app settings, audit log table, and presets table

-- ============================================================================
-- LIMITS SETTINGS
-- ============================================================================

INSERT INTO app_settings (key, value, label, description, category, value_type, value_constraints, visible_to, editable_by, show_in_league_settings)
VALUES
  ('max_batch_uploads', '7', 'Max Batch Uploads', 'Maximum number of days that can be uploaded at once', 'limits', 'number', '{"min": 1, "max": 31}', '{superadmin}', '{superadmin}', true),
  ('max_backfill_days', '7', 'Max Backfill Days', 'How many days back users can submit steps', 'limits', 'number', '{"min": 1, "max": 30}', '{superadmin}', '{superadmin}', true),
  ('max_league_members', '50', 'Max League Members', 'Default maximum members per league', 'limits', 'number', '{"min": 2, "max": 500}', '{superadmin}', '{superadmin}', false)
ON CONFLICT (key) DO UPDATE SET
  value_constraints = EXCLUDED.value_constraints,
  show_in_league_settings = EXCLUDED.show_in_league_settings,
  updated_at = NOW();

-- ============================================================================
-- FEATURE FLAGS
-- ============================================================================

INSERT INTO app_settings (key, value, label, description, category, value_type, visible_to, editable_by)
VALUES
  ('feature_high_fives', 'true', 'High Fives', 'Allow users to send high fives to celebrate achievements (PRD 31)', 'features', 'boolean', '{superadmin}', '{superadmin}'),
  ('feature_streak_freeze', 'false', 'Streak Freeze', 'Allow users to freeze their streak once per week (PRD 28)', 'features', 'boolean', '{superadmin}', '{superadmin}'),
  ('feature_analytics_export', 'false', 'Analytics Export', 'Allow users to export their analytics data as CSV/PDF (PRD 32)', 'features', 'boolean', '{superadmin}', '{superadmin}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- DEFAULT VALUES
-- ============================================================================

INSERT INTO app_settings (key, value, label, description, category, value_type, value_constraints, value_options, visible_to, editable_by)
VALUES
  ('default_daily_step_goal', '10000', 'Default Daily Step Goal', 'Default step goal for new leagues', 'defaults', 'number', '{"min": 1000, "max": 100000}', NULL, '{superadmin}', '{superadmin}'),
  ('default_stepweek_start', '"monday"', 'Default Week Start', 'Default start day for step weeks in new leagues', 'defaults', 'select', NULL, '[{"value":"monday","label":"Monday"},{"value":"sunday","label":"Sunday"}]', '{superadmin}', '{superadmin}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- DISPLAY SETTINGS
-- ============================================================================

INSERT INTO app_settings (key, value, label, description, category, value_type, visible_to, editable_by)
VALUES
  ('show_global_leaderboard', 'false', 'Global Leaderboard', 'Display a cross-league leaderboard showing top performers', 'display', 'boolean', '{superadmin}', '{superadmin}'),
  ('maintenance_mode', 'false', 'Maintenance Mode', 'Show a maintenance banner to all users', 'display', 'boolean', '{superadmin}', '{superadmin}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL REFERENCES app_settings(key) ON DELETE CASCADE,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_app_settings_audit_key ON app_settings_audit(setting_key);
CREATE INDEX IF NOT EXISTS idx_app_settings_audit_changed_at ON app_settings_audit(changed_at DESC);

-- Enable RLS on audit table
ALTER TABLE app_settings_audit ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit log
DROP POLICY IF EXISTS "SuperAdmin read audit log" ON app_settings_audit;
CREATE POLICY "SuperAdmin read audit log" ON app_settings_audit
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- Only superadmins can insert audit entries (via API)
DROP POLICY IF EXISTS "SuperAdmin insert audit log" ON app_settings_audit;
CREATE POLICY "SuperAdmin insert audit log" ON app_settings_audit
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- ============================================================================
-- PRESETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_default BOOLEAN DEFAULT false
);

-- Enable RLS on presets table
ALTER TABLE app_settings_presets ENABLE ROW LEVEL SECURITY;

-- Only superadmins can manage presets
DROP POLICY IF EXISTS "SuperAdmin manage presets" ON app_settings_presets;
CREATE POLICY "SuperAdmin manage presets" ON app_settings_presets
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- ============================================================================
-- SEED DEFAULT PRESETS
-- ============================================================================

INSERT INTO app_settings_presets (name, description, settings, is_default)
VALUES
  (
    'Development',
    'Relaxed limits for testing - all features enabled',
    '{
      "max_batch_uploads": 31,
      "max_backfill_days": 30,
      "max_league_members": 100,
      "feature_high_fives": true,
      "feature_streak_freeze": true,
      "feature_analytics_export": true,
      "default_daily_step_goal": 10000,
      "default_stepweek_start": "monday",
      "show_global_leaderboard": true,
      "maintenance_mode": false
    }'::jsonb,
    false
  ),
  (
    'Staging',
    'Production-like settings with all features enabled for testing',
    '{
      "max_batch_uploads": 7,
      "max_backfill_days": 7,
      "max_league_members": 50,
      "feature_high_fives": true,
      "feature_streak_freeze": true,
      "feature_analytics_export": true,
      "default_daily_step_goal": 10000,
      "default_stepweek_start": "monday",
      "show_global_leaderboard": false,
      "maintenance_mode": false
    }'::jsonb,
    false
  ),
  (
    'Production',
    'Conservative defaults for live environment',
    '{
      "max_batch_uploads": 7,
      "max_backfill_days": 7,
      "max_league_members": 50,
      "feature_high_fives": true,
      "feature_streak_freeze": false,
      "feature_analytics_export": false,
      "default_daily_step_goal": 10000,
      "default_stepweek_start": "monday",
      "show_global_leaderboard": false,
      "maintenance_mode": false
    }'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- ============================================================================
-- UPDATE RLS POLICIES FOR app_settings
-- Add policy for reading all categories (not just display/general)
-- ============================================================================

-- SuperAdmins can read all settings (existing policy already handles this)
-- Update the display/general policy to include limits when show_in_league_settings is true
DROP POLICY IF EXISTS "Users read display settings" ON app_settings;
CREATE POLICY "Users read visible settings" ON app_settings
FOR SELECT TO authenticated
USING (
  -- SuperAdmin can see everything
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  OR
  -- Regular users can see display and general categories
  category IN ('display', 'general')
  OR
  -- Users can see settings marked as visible in league settings
  show_in_league_settings = true
);
