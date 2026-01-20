/**
 * Navigation Configuration (DEPRECATED)
 * 
 * This file is kept for backward compatibility.
 * All menu definitions are now in src/lib/menuConfig.ts
 * 
 * @deprecated Use menuConfig.ts instead
 */

// Re-export everything from the new menuConfig for backward compatibility
export {
    // Types
    type MenuItem as NavItem,
    type MenuDefinition as NavSection,
    type UserRole,

    // Role utilities
    USER_ROLES,
    hasMinimumRole,
    isVisibleToRole,
    filterMenuByRole,
    prepareMenuItems,

    // Menu definitions (legacy names mapped to new structure)
    LEAGUE_MENU_ITEMS,
    ACTIONS_MENU_ITEMS,
    FOOTER_LINKS,

    // New exports
    MENUS,
    MAIN_MENU,
    USER_MENU,
    ADMIN_MENU,
    HELP_MENU,
    FOOTER_NAVIGATION,
    FOOTER_ACCOUNT,
    FOOTER_LEGAL,
} from './menuConfig';

// Legacy constants
export const MENU_LIMIT_WARNING_THRESHOLD = 7;

/**
 * @deprecated Use menuConfig.ts filterMenuByRole instead
 */
export function validateMenuSize(menuName: string, items: { label: string }[]) {
    if (items.length > MENU_LIMIT_WARNING_THRESHOLD) {
        console.warn(
            `[UX Warning] The "${menuName}" menu has ${items.length} items, which exceeds the recommended limit of ${MENU_LIMIT_WARNING_THRESHOLD}. Consider grouping items or removing less important ones.`
        );
    }
}

// Legacy re-exports for superadmin pages
export { SUPERADMIN_PAGES } from './adminPages';

// Legacy USER_MENU_SECTIONS for any remaining consumers
import { MENUS } from './menuConfig';
export const USER_MENU_SECTIONS = [{ items: MENUS.user.items }];

