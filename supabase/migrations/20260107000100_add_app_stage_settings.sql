-- PRD 26 (Partial): Add development stage setting to app_settings
-- This migration adds a simple development stage tracking system

-- Drop and recreate app_settings table to ensure proper constraints
DROP TABLE IF EXISTS app_settings CASCADE;

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,

  -- Metadata
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'limits', 'features', 'defaults', 'display', 'general'

  -- Type info for UI rendering
  value_type TEXT NOT NULL, -- 'number', 'boolean', 'string', 'select', 'json'
  value_options JSONB, -- For 'select' type: [{ value: 'a', label: 'A' }]
  value_constraints JSONB, -- { min: 1, max: 100 } for numbers

  -- Visibility controls
  visible_to TEXT[] DEFAULT '{superadmin}', -- Array of roles
  editable_by TEXT[] DEFAULT '{superadmin}', -- Who can edit
  show_in_league_settings BOOLEAN DEFAULT false,
  show_in_user_settings BOOLEAN DEFAULT false,

  -- Audit
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can do everything
DROP POLICY IF EXISTS "SuperAdmin full access" ON app_settings;
CREATE POLICY "SuperAdmin full access" ON app_settings
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- All authenticated users can read display category settings (for stage badge)
DROP POLICY IF EXISTS "Users read display settings" ON app_settings;
CREATE POLICY "Users read display settings" ON app_settings
FOR SELECT TO authenticated
USING (category = 'display' OR category = 'general');

-- Insert development stage setting
INSERT INTO app_settings (key, value, label, description, category, value_type, value_options, visible_to, editable_by)
VALUES (
  'development_stage',
  '{"stage": "pre-alpha", "badge_visible": true}',
  'Development Stage',
  'Current development stage of the application',
  'general',
  'select',
  '[
    {"value": "pre-alpha", "label": "Pre-Alpha", "color": "purple"},
    {"value": "alpha", "label": "Alpha", "color": "blue"},
    {"value": "beta", "label": "Beta", "color": "amber"},
    {"value": "product-hunt", "label": "Product Hunt", "color": "orange"},
    {"value": "production", "label": "Production", "color": "green"}
  ]'::jsonb,
  '{superadmin}',
  '{superadmin}'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  value_options = EXCLUDED.value_options,
  updated_at = NOW();

-- Add stage descriptions for the info page
INSERT INTO app_settings (key, value, label, description, category, value_type, visible_to, editable_by)
VALUES (
  'stage_descriptions',
  '{
    "pre-alpha": {
      "title": "Pre-Alpha",
      "emoji": "🧪",
      "tagline": "Experimental - Core features in development",
      "what_it_means": [
        "Core features are still being built",
        "Significant changes expected daily",
        "Data may be reset without notice",
        "Some features may be incomplete or unstable"
      ],
      "known_limitations": [
        "AI verification may occasionally misread step counts",
        "Some fitness apps may have screenshot formats we haven''t encountered yet",
        "Mobile experience is functional but being optimized"
      ]
    },
    "alpha": {
      "title": "Alpha",
      "emoji": "🔧",
      "tagline": "Internal Testing - Core features complete",
      "what_it_means": [
        "Core features are complete and functional",
        "Active bug fixing and optimization",
        "Minor data resets possible (with warning)",
        "Limited to invited testers only"
      ],
      "known_limitations": [
        "Performance optimizations ongoing",
        "Some edge cases may not be handled",
        "UI polish in progress"
      ]
    },
    "beta": {
      "title": "Beta",
      "emoji": "🚧",
      "tagline": "Early Access - Testing with real users",
      "what_it_means": [
        "Features may change based on feedback",
        "You may encounter bugs or unexpected behavior",
        "Data stability improved (resets rare)",
        "Performance optimizations ongoing"
      ],
      "known_limitations": [
        "Some advanced features still in development",
        "Minor bugs expected",
        "Mobile app not yet available"
      ]
    },
    "product-hunt": {
      "title": "Product Hunt Launch",
      "emoji": "🚀",
      "tagline": "Public Launch - Ready for new users",
      "what_it_means": [
        "Stable release ready for public use",
        "Core features tested and reliable",
        "Active support and rapid bug fixes",
        "New features rolling out regularly"
      ],
      "known_limitations": [
        "Some advanced features may be premium-only",
        "Native mobile apps coming soon"
      ]
    },
    "production": {
      "title": "Production",
      "emoji": "✅",
      "tagline": "Stable - Full production release",
      "what_it_means": [
        "Fully stable and production-ready",
        "Comprehensive feature set",
        "Regular updates and improvements",
        "Professional support available"
      ],
      "known_limitations": []
    }
  }'::jsonb,
  'Stage Descriptions',
  'Descriptions for each development stage shown on the info page',
  'general',
  'json',
  '{superadmin}',
  '{superadmin}'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
