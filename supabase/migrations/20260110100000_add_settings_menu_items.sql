-- =============================================
-- Add missing settings menu items
-- PRD-26: Ensure all settings accessible via menu
-- =============================================

-- First, add unique constraint on (menu_id, item_key) if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_menu_id_item_key_unique'
  ) THEN
    ALTER TABLE menu_items ADD CONSTRAINT menu_items_menu_id_item_key_unique UNIQUE (menu_id, item_key);
  END IF;
END $$;

-- 1. Add App Settings to admin menu (first position)
INSERT INTO menu_items (menu_id, item_key, label, href, icon, description, visible_to, sort_order)
VALUES ('admin', 'admin-settings', '⚙️ App Settings', '/admin/settings', '⚙️',
        'Feature flags & system limits', '{superadmin}', 0)
ON CONFLICT (menu_id, item_key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Shift existing admin items down (only those with sort_order >= 0)
UPDATE menu_items SET sort_order = sort_order + 1
WHERE menu_id = 'admin' AND item_key != 'admin-settings' AND sort_order >= 0;

-- 2. Add Preferences to user menu (before Sign Out)
INSERT INTO menu_items (menu_id, item_key, label, href, icon, description, visible_to, sort_order)
VALUES ('user', 'user-preferences', 'Preferences', '/settings/preferences', '🎨',
        'Theme and display settings', NULL, 1)
ON CONFLICT (menu_id, item_key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Update Sign Out to be last with divider
UPDATE menu_items SET sort_order = 2, divider_before = true
WHERE menu_id = 'user' AND item_key = 'sign-out';

-- 3. Add Preferences to footer account
INSERT INTO menu_items (menu_id, item_key, label, href, icon, visible_to, sort_order)
VALUES ('footerAccount', 'footer-preferences', 'Preferences', '/settings/preferences', '🎨', NULL, 1)
ON CONFLICT (menu_id, item_key) DO NOTHING;

-- Shift footer feedback down
UPDATE menu_items SET sort_order = 2
WHERE menu_id = 'footerAccount' AND item_key = 'footer-feedback';

-- 4. Add league_nav menu definition (if not exists)
INSERT INTO menu_definitions (id, label, description)
VALUES ('league_nav', 'League Navigation', 'Horizontal tabs within league pages')
ON CONFLICT (id) DO NOTHING;

-- 5. Add league_nav menu items
INSERT INTO menu_items (menu_id, item_key, label, href, icon, visible_to, sort_order) VALUES
  ('league_nav', 'league-overview', 'Overview', '/league/[id]/overview', '🏠', NULL, 0),
  ('league_nav', 'league-submit', 'Submit Steps', '/submit-steps', '📝', NULL, 1),
  ('league_nav', 'league-rankings', 'Rankings', '/league/[id]/leaderboard', '🏆', NULL, 2),
  ('league_nav', 'league-progress', 'My Progress', '/league/[id]/analytics', '📊', NULL, 3),
  ('league_nav', 'league-settings', 'Settings', '/league/[id]/settings', '⚙️', '{admin,owner,superadmin}', 4)
ON CONFLICT (menu_id, item_key) DO NOTHING;
