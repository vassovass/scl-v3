-- PRD-57: Add My Stats and Share Progress menu items
-- These are soft CTAs in the Actions menu to encourage stat tracking and sharing

-- Add My Stats to Actions submenu
INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, visible_to, divider_before, sort_order)
SELECT
    'main',
    id,
    'my-stats',
    'My Stats',
    '/my-stats',
    '📊',
    'View your progress',
    ARRAY['member', 'admin', 'owner', 'superadmin']::TEXT[],
    true,  -- Add divider before to separate from league actions
    100    -- High sort order to place after existing items
FROM menu_items
WHERE item_key = 'actions' AND menu_id = 'main';

-- Add Share Progress to Actions submenu
INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, visible_to, sort_order)
SELECT
    'main',
    id,
    'share-progress',
    'Share Progress',
    '/my-stats#share',
    '🔗',
    'Share with friends',
    ARRAY['member', 'admin', 'owner', 'superadmin']::TEXT[],
    101    -- Right after My Stats
FROM menu_items
WHERE item_key = 'actions' AND menu_id = 'main';

-- Add comment for documentation
COMMENT ON TABLE menu_items IS 'WordPress-style menu items. Updated with PRD-57 stats/share CTAs.';
