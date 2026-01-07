-- Update Beta Info menu items to point to new /stage-info page
-- This makes the menu items dynamic and scalable across all development stages

-- Update all Beta Info menu items to point to /stage-info
UPDATE menu_items
SET
    href = '/stage-info',
    label = 'Stage Info',
    updated_at = NOW()
WHERE href = '/beta' OR item_key LIKE '%beta%';

-- Update the icon to be more generic (using 📊 for development/progress)
UPDATE menu_items
SET
    icon = '📊',
    updated_at = NOW()
WHERE item_key IN ('beta-info', 'public-beta', 'footer-beta');

-- Update descriptions to be more informative
UPDATE menu_items
SET
    description = 'Current development stage and roadmap',
    updated_at = NOW()
WHERE item_key = 'public-beta';

-- Add Stage Info to Admin menu for SuperAdmin quick access
INSERT INTO menu_items (menu_id, item_key, label, href, description, visible_to, sort_order)
VALUES (
    'admin',
    'admin-stage-info',
    '📊 Stage Info',
    '/stage-info',
    'View current stage details',
    ARRAY['superadmin']::TEXT[],
    4
)
ON CONFLICT (menu_id, item_key) DO UPDATE SET
    label = EXCLUDED.label,
    href = EXCLUDED.href,
    description = EXCLUDED.description,
    updated_at = NOW();
