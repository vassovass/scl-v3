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
-- Check if the item already exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM menu_items
        WHERE menu_id = 'admin' AND item_key = 'admin-stage-info'
    ) THEN
        INSERT INTO menu_items (menu_id, item_key, label, href, description, visible_to, sort_order)
        VALUES (
            'admin',
            'admin-stage-info',
            '📊 Stage Info',
            '/stage-info',
            'View current stage details',
            ARRAY['superadmin']::TEXT[],
            4
        );
    ELSE
        UPDATE menu_items SET
            label = '📊 Stage Info',
            href = '/stage-info',
            description = 'View current stage details',
            updated_at = NOW()
        WHERE menu_id = 'admin' AND item_key = 'admin-stage-info';
    END IF;
END $$;
