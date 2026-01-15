-- Fix footer menu labels to be user-friendly display names
-- Changes "Footer Navigation" -> "Navigation", etc.

UPDATE menu_definitions
SET label = 'Navigation'
WHERE id = 'footerNavigation';

UPDATE menu_definitions
SET label = 'Account'
WHERE id = 'footerAccount';

UPDATE menu_definitions
SET label = 'Legal'
WHERE id = 'footerLegal';
