-- Add feature_user_tracking setting
-- PRD 14: Master toggle for user activity tracking
-- When disabled, no analytics events are sent regardless of consent
-- When enabled, consent-based tracking is in effect

INSERT INTO app_settings (key, value, label, description, category, value_type, visible_to, editable_by)
VALUES (
  'feature_user_tracking',
  'true',
  'User Activity Tracking',
  'Enable anonymous user activity tracking via GA4 and PostHog. When disabled, no analytics events are sent. When enabled, consent-based tracking is in effect.',
  'features',
  'boolean',
  ARRAY['superadmin'],
  ARRAY['superadmin']
) ON CONFLICT (key) DO NOTHING;
