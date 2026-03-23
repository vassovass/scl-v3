-- PRD 69: Add SEO content pages to navigation menus
-- Adds footerGuides menu, public nav "Guides" dropdown, and updates footer location

-- 1. Create the footerGuides menu definition
INSERT INTO menu_definitions (id, label, description)
VALUES ('footerGuides', 'Guides', 'Footer guides column with SEO content pages')
ON CONFLICT (id) DO NOTHING;

-- 2. Add items to footerGuides
INSERT INTO menu_items (menu_id, item_key, label, href, sort_order)
VALUES
  ('footerGuides', 'footer-step-challenge-app', 'Best Step Challenge Apps', '/step-challenge-app', 0),
  ('footerGuides', 'footer-walking-friends', 'Walking Challenge With Friends', '/walking-challenge-with-friends', 1),
  ('footerGuides', 'footer-workplace', 'Workplace Step Challenge', '/workplace-step-challenge', 2),
  ('footerGuides', 'footer-compare', 'Compare Apps', '/compare', 3)
ON CONFLICT DO NOTHING;

-- 3. Add missing public menu items (How It Works, Pricing, For Teams) that exist in static but not DB
INSERT INTO menu_items (menu_id, item_key, label, href, icon, visible_to, sort_order)
VALUES
  ('public', 'public-how-it-works', 'How It Works', '/how-it-works', '⚡', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 1),
  ('public', 'public-pricing', 'Pricing', '/pricing', '💎', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 2),
  ('public', 'public-teams', 'For Teams', '/teams', '🏢', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 3)
ON CONFLICT DO NOTHING;

-- 4. Add "Guides" dropdown parent to public menu
INSERT INTO menu_items (menu_id, item_key, label, icon, visible_to, sort_order)
VALUES ('public', 'public-guides', 'Guides', '📖', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 4)
ON CONFLICT DO NOTHING;

-- 5. Add children to the Guides dropdown
INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, visible_to, sort_order)
SELECT 'public', id, 'guide-step-challenge-app', 'Best Step Challenge Apps', '/step-challenge-app', '📱', '2026 comparison guide', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 0
FROM menu_items WHERE item_key = 'public-guides' AND menu_id = 'public';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, visible_to, sort_order)
SELECT 'public', id, 'guide-walking-friends', 'Walking Challenge With Friends', '/walking-challenge-with-friends', '👟', 'Setup guide & challenge ideas', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 1
FROM menu_items WHERE item_key = 'public-guides' AND menu_id = 'public';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, visible_to, sort_order)
SELECT 'public', id, 'guide-workplace', 'Workplace Step Challenge', '/workplace-step-challenge', '🏢', 'HR setup & ROI guide', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 2
FROM menu_items WHERE item_key = 'public-guides' AND menu_id = 'public';

INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, description, visible_to, sort_order)
SELECT 'public', id, 'guide-compare', 'Compare All Apps', '/compare', '⚖️', 'Side-by-side comparisons', ARRAY['guest', 'member', 'admin', 'owner', 'superadmin']::TEXT[], 3
FROM menu_items WHERE item_key = 'public-guides' AND menu_id = 'public';

-- 6. Update Roadmap sort_order in public menu to come after Guides
UPDATE menu_items
SET sort_order = 5
WHERE item_key = 'public-roadmap' AND menu_id = 'public';

-- 7. Update footer location to include footerGuides
UPDATE menu_locations
SET menu_ids = ARRAY['footerNavigation', 'footerGuides', 'footerAccount', 'footerLegal']::TEXT[]
WHERE location = 'footer';

-- 8. Add missing footer nav items (How It Works, Why Upload, Pricing, For Teams)
INSERT INTO menu_items (menu_id, item_key, label, href, sort_order)
VALUES
  ('footerNavigation', 'footer-how-it-works', 'How It Works', '/how-it-works', 3),
  ('footerNavigation', 'footer-why-upload', 'Why Upload', '/why-upload', 4),
  ('footerNavigation', 'footer-pricing', 'Pricing', '/pricing', 5),
  ('footerNavigation', 'footer-teams', 'For Teams', '/teams', 6)
ON CONFLICT DO NOTHING;
