-- Rename footer menus to "Footer Column X" for better Admin UI organization
-- Frontend headers are now hardcoded to "Navigation", "Account", "Legal" in GlobalFooter.tsx
-- so these labels are only used for the Menu Editor configuration.

UPDATE menu_definitions
SET label = 'Footer Column 1'
WHERE id = 'footerNavigation';

UPDATE menu_definitions
SET label = 'Footer Column 2'
WHERE id = 'footerAccount';

UPDATE menu_definitions
SET label = 'Footer Column 3'
WHERE id = 'footerLegal';
