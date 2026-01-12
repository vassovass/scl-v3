-- Add SuperAdmin-configurable theme mode defaults and availability

INSERT INTO app_settings (key, value, label, description, category, value_type, value_options, visible_to, editable_by)
VALUES
  (
    'default_theme_mode',
    '"system"',
    'Default Theme Mode',
    'Default theme mode applied to new and signed-out users.',
    'appearance',
    'select',
    '[{"value":"dark","label":"Dark"},{"value":"light","label":"Light"},{"value":"system","label":"System"}]'::jsonb,
    '{superadmin,everyone}',
    '{superadmin}'
  ),
  (
    'allow_theme_dark',
    'true',
    'Allow Dark Mode',
    'Enable dark mode selection for users.',
    'appearance',
    'boolean',
    NULL,
    '{superadmin,everyone}',
    '{superadmin}'
  ),
  (
    'allow_theme_light',
    'true',
    'Allow Light Mode',
    'Enable light mode selection for users.',
    'appearance',
    'boolean',
    NULL,
    '{superadmin,everyone}',
    '{superadmin}'
  ),
  (
    'allow_theme_system',
    'true',
    'Allow System Mode',
    'Enable system theme selection for users.',
    'appearance',
    'boolean',
    NULL,
    '{superadmin,everyone}',
    '{superadmin}'
  )
ON CONFLICT (key) DO NOTHING;
