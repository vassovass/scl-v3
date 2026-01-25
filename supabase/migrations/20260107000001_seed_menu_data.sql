-- PRD 24: Seed menu data from existing menuConfig.ts
-- This migration converts the static menu configuration into database records

-- Insert menu definitions
INSERT INTO menu_definitions (id, label, description) VALUES
('main', 'Main Navigation', 'Primary navigation menu for dashboard and league pages'),
('help', 'Help', 'Help and onboarding resources'),
('user', 'User Account', 'User account settings and actions'),
('admin', 'Admin', 'SuperAdmin menu'),
('public', 'Public Pages', 'Public/marketing pages menu'),
('footerNavigation', 'Footer Navigation', 'Footer navigation column'),
('footerAccount', 'Footer Account', 'Footer account column'),
('footerLegal', 'Footer Legal', 'Footer legal links column');

-- Insert MAIN menu items
INSERT INTO menu_items (menu_id, item_key, label, href, icon, sort_order) VALUES
('main', 'dashboard', 'Dashboard', '/dashboard', '📊', 0),
('main', 'league', 'League', NULL, '🏆', 1),
('main', 'actions', 'Actions', NULL, '⚡', 2),
('main', 'roadmap', 'Roadmap', '/roadmap', '🗺️', 3);

-- Update roadmap to be visible to all (including guests)
UPDATE menu_items
SET visible_to = ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[]
WHERE item_key = 'roadmap' AND menu_id = 'main';

-- Insert League submenu items
INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, requires_league, sort_order)
SELECT 'main', id, 'league-submit', 'Submit Steps', '/submit-steps', '📝', true, 0
FROM menu_items WHERE item_key = 'league' AND menu_id = 'main';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, requires_league, sort_order)
SELECT 'main', id, 'league-leaderboard', 'Leaderboard', '/league/[id]/leaderboard', '🏆', true, 1
FROM menu_items WHERE item_key = 'league' AND menu_id = 'main';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, requires_league, sort_order)
SELECT 'main', id, 'league-analytics', 'Analytics', '/league/[id]/analytics', '📊', true, 2
FROM menu_items WHERE item_key = 'league' AND menu_id = 'main';

-- Insert Actions submenu items
INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, sort_order)
SELECT 'main', id, 'create-league', 'Create League', '/league/create', '➕', 0
FROM menu_items WHERE item_key = 'actions' AND menu_id = 'main';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, sort_order)
SELECT 'main', id, 'join-league', 'Join League', '/join', '🔗', 1
FROM menu_items WHERE item_key = 'actions' AND menu_id = 'main';

-- Insert HELP menu items
INSERT INTO menu_items (menu_id, item_key, label, icon, sort_order) VALUES
('help', 'guides', 'Guided Tours', '🎓', 0);

INSERT INTO menu_items (menu_id, item_key, label, href, icon, sort_order) VALUES
('help', 'feedback', 'Send Feedback', '/feedback', '💬', 1),
('help', 'roadmap', 'Roadmap', '/roadmap', '🗺️', 2),
('help', 'beta-info', 'Beta Info', '/beta', '📋', 3);

-- Insert Guided Tours submenu items
-- Note: hrefs must match tour IDs in src/lib/tours/registry.ts
INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, on_click, sort_order)
SELECT 'help', id, 'tour-dashboard', 'Dashboard Tour', '#tour-dashboard-v1', '🏠', '~2m', 'startTour', 0
FROM menu_items WHERE item_key = 'guides' AND menu_id = 'help';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, on_click, sort_order)
SELECT 'help', id, 'tour-league-create', 'Create a League', '#tour-league-v1', '🏆', '~1m', 'startTour', 1
FROM menu_items WHERE item_key = 'guides' AND menu_id = 'help';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, on_click, sort_order)
SELECT 'help', id, 'tour-submit-steps', 'Submit Steps', '#tour-submit-steps-v1', '📝', '~2m', 'startTour', 2
FROM menu_items WHERE item_key = 'guides' AND menu_id = 'help';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, on_click, sort_order)
SELECT 'help', id, 'tour-leaderboard', 'Leaderboard Tour', '#tour-leaderboard-v1', '📊', '~1m', 'startTour', 3
FROM menu_items WHERE item_key = 'guides' AND menu_id = 'help';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, on_click, visible_to, sort_order)
SELECT 'help', id, 'tour-admin', 'Admin Analytics Tour', '#tour-admin-v1', '🛡️', '~1m', 'startTour', ARRAY['admin', 'owner', 'superadmin']::TEXT[], 4
FROM menu_items WHERE item_key = 'guides' AND menu_id = 'help';

-- Insert USER menu items
INSERT INTO menu_items (menu_id, item_key, label, href, icon, sort_order) VALUES
('user', 'profile-settings', 'Profile Settings', '/settings/profile', '⚙️', 0);

INSERT INTO menu_items (menu_id, item_key, label, icon, on_click, divider_before, sort_order) VALUES
('user', 'sign-out', 'Sign Out', '🚪', 'signOut', true, 1);

-- Insert ADMIN menu items
INSERT INTO menu_items (menu_id, item_key, label, href, description, visible_to, sort_order) VALUES
('admin', 'admin-kanban', '📋 Kanban Board', '/admin/kanban', 'Task management', ARRAY['superadmin']::TEXT[], 0),
('admin', 'admin-design', '🎨 Design System', '/admin/design-system', 'Brand guidelines', ARRAY['superadmin']::TEXT[], 1),
('admin', 'admin-feedback', '💬 Feedback', '/admin/feedback', 'View user feedback', ARRAY['superadmin']::TEXT[], 2);

-- Insert PUBLIC menu items
INSERT INTO menu_items (menu_id, item_key, label, href, icon, visible_to, sort_order) VALUES
('public', 'public-features', 'Features', '/#features', '✨', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 0),
('public', 'public-roadmap', 'Roadmap', '/roadmap', '🗺️', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 1),
('public', 'public-beta', 'Beta Info', '/beta', '🚧', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 2);

-- Insert FOOTER NAVIGATION items
INSERT INTO menu_items (menu_id, item_key, label, href, sort_order) VALUES
('footerNavigation', 'footer-dashboard', 'Dashboard', '/dashboard', 0),
('footerNavigation', 'footer-create', 'Create League', '/league/create', 1),
('footerNavigation', 'footer-join', 'Join League', '/join', 2);

-- Insert FOOTER ACCOUNT items
INSERT INTO menu_items (menu_id, item_key, label, href, sort_order) VALUES
('footerAccount', 'footer-profile', 'Profile Settings', '/settings/profile', 0),
('footerAccount', 'footer-feedback', 'Send Feedback', '/feedback', 1);

-- Insert FOOTER LEGAL items
INSERT INTO menu_items (menu_id, item_key, label, href, sort_order) VALUES
('footerLegal', 'footer-terms', 'Terms of Service', '/terms', 0),
('footerLegal', 'footer-privacy', 'Privacy Policy', '/privacy', 1),
('footerLegal', 'footer-security', 'Security', '/security', 2),
('footerLegal', 'footer-beta', 'Beta Info', '/beta', 3);

-- Insert menu location configurations
INSERT INTO menu_locations (location, menu_ids, show_logo, show_sign_in, show_user_menu, show_admin_menu) VALUES
('public_header', ARRAY['public']::TEXT[], true, true, true, true),
('app_header', ARRAY['main', 'help']::TEXT[], true, true, true, true),
('admin_header', ARRAY['main', 'help']::TEXT[], true, true, true, true),
('footer', ARRAY['footerNavigation', 'footerAccount', 'footerLegal']::TEXT[], true, false, false, false);

-- Update admin_header with custom class
UPDATE menu_locations SET class_name = 'admin-header' WHERE location = 'admin_header';
