-- PRD 44: Auto-Enroll World League
-- Enroll all existing users in World League + insert feature flag setting

-- Step 1: Insert feature flag setting
INSERT INTO app_settings (key, value, label, description, category, value_type, visible_to, editable_by)
VALUES (
  'feature_auto_enroll_world_league',
  'true',
  'Auto-Enroll World League',
  'Automatically add new users and proxies to the World League on signup (PRD 44)',
  'features',
  'toggle',
  ARRAY['superadmin'],
  ARRAY['superadmin']
) ON CONFLICT (key) DO NOTHING;

-- Step 2: Enroll all existing real users (non-proxy) in World League
-- Uses ON CONFLICT to be idempotent (safe to re-run)
INSERT INTO memberships (league_id, user_id, role)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  id,
  'member'
FROM users
WHERE is_proxy = false
  AND deleted_at IS NULL
ON CONFLICT (league_id, user_id) DO NOTHING;

-- Step 3: Enroll all existing proxy users in World League
-- Proxies should also compete globally
INSERT INTO memberships (league_id, user_id, role)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  id,
  'member'
FROM users
WHERE is_proxy = true
  AND deleted_at IS NULL
ON CONFLICT (league_id, user_id) DO NOTHING;
