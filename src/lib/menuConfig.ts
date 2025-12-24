/**
 * Modular Menu Configuration System
 * 
 * WordPress-style menu system with:
 * - Unlimited submenu nesting depth
 * - Role-based visibility per item
 * - Dynamic context (league ID, etc.)
 * - Feedback system integration
 * 
 * Usage:
 *   import { MENUS, filterMenuByRole } from '@/lib/menuConfig';
 *   const visibleItems = filterMenuByRole(MENUS.main.items, userRole);
 */

// ----------------------------
// Types
// ----------------------------

/**
 * User roles in order of privilege (lowest to highest)
 * New roles can be added here and will automatically be available in menu visibility
 */
export const USER_ROLES = ['guest', 'member', 'admin', 'owner', 'superadmin'] as const;
export type UserRole = typeof USER_ROLES[number];

/**
 * Menu item definition - supports unlimited nesting via children
 */
export interface MenuItem {
    /** Unique identifier for this item (used for feedback tracking) */
    id: string;
    /** Display label */
    label: string;
    /** URL path (can include [id] for dynamic league ID) */
    href?: string;
    /** Emoji or icon string */
    icon?: string;
    /** Optional description/subtitle */
    description?: string;
    /** Nested submenu items - unlimited depth */
    children?: MenuItem[];
    /** Roles that can see this item (empty = all authenticated users) */
    visibleTo?: UserRole[];
    /** Roles that CANNOT see this item (takes precedence over visibleTo) */
    hiddenFrom?: UserRole[];
    /** Only show when user is in a league context */
    requiresLeague?: boolean;
    /** Named action handler instead of navigation (e.g., "startTour") */
    onClick?: string;
    /** External link (opens in new tab) */
    external?: boolean;
    /** Separator before this item */
    dividerBefore?: boolean;
}

/**
 * Menu definition - a named collection of items
 */
export interface MenuDefinition {
    id: string;
    label?: string;
    items: MenuItem[];
}

// ----------------------------
// Role Utilities
// ----------------------------

/**
 * Check if a role has at least the minimum privilege level
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
    return USER_ROLES.indexOf(userRole) >= USER_ROLES.indexOf(minimumRole);
}

/**
 * Check if a menu item is visible to a given role
 */
export function isVisibleToRole(item: MenuItem, userRole: UserRole): boolean {
    // If explicitly hidden from this role, hide it
    if (item.hiddenFrom?.includes(userRole)) {
        return false;
    }

    // If visibleTo is specified, check if role is in the list
    if (item.visibleTo && item.visibleTo.length > 0) {
        return item.visibleTo.includes(userRole);
    }

    // Default: visible to all authenticated users (not guests)
    return userRole !== 'guest';
}

/**
 * Filter menu items by role, recursively handling children
 */
export function filterMenuByRole(items: MenuItem[], userRole: UserRole): MenuItem[] {
    return items
        .filter(item => isVisibleToRole(item, userRole))
        .map(item => ({
            ...item,
            children: item.children ? filterMenuByRole(item.children, userRole) : undefined
        }))
        .filter(item => !item.children || item.children.length > 0 || item.href);
}

/**
 * Replace [id] placeholders in hrefs with actual league ID
 */
export function resolveMenuHrefs(items: MenuItem[], leagueId?: string): MenuItem[] {
    return items.map(item => ({
        ...item,
        href: item.href && leagueId ? item.href.replace('[id]', leagueId) : item.href,
        children: item.children ? resolveMenuHrefs(item.children, leagueId) : undefined
    }));
}

/**
 * Filter items that require league context
 */
export function filterByLeagueContext(items: MenuItem[], hasLeague: boolean): MenuItem[] {
    return items
        .filter(item => !item.requiresLeague || hasLeague)
        .map(item => ({
            ...item,
            children: item.children ? filterByLeagueContext(item.children, hasLeague) : undefined
        }));
}

/**
 * Combined filter: role + league context + resolve hrefs
 */
export function prepareMenuItems(
    items: MenuItem[],
    userRole: UserRole,
    leagueId?: string
): MenuItem[] {
    let filtered = filterMenuByRole(items, userRole);
    filtered = filterByLeagueContext(filtered, !!leagueId);
    filtered = resolveMenuHrefs(filtered, leagueId);
    return filtered;
}

// ----------------------------
// Menu Definitions
// ----------------------------

/**
 * Main navigation menu (Dashboard, League, Actions)
 */
export const MAIN_MENU: MenuDefinition = {
    id: 'main',
    items: [
        {
            id: 'dashboard',
            label: 'Dashboard',
            href: '/dashboard',
            icon: '📊',
        },
        {
            id: 'league',
            label: 'League',
            icon: '🏆',
            requiresLeague: true,
            children: [
                { id: 'league-submit', label: 'Submit Steps', href: '/league/[id]', icon: '📝' },
                { id: 'league-leaderboard', label: 'Leaderboard', href: '/league/[id]/leaderboard', icon: '🏆' },
                { id: 'league-analytics', label: 'Analytics', href: '/league/[id]/analytics', icon: '📊' },
            ]
        },
        {
            id: 'actions',
            label: 'Actions',
            icon: '⚡',
            children: [
                { id: 'create-league', label: 'Create League', href: '/league/create', icon: '➕' },
                { id: 'join-league', label: 'Join League', href: '/join', icon: '🔗' },
            ]
        },
    ]
};

/**
 * Help & Onboarding menu (moved from user menu)
 */
export const HELP_MENU: MenuDefinition = {
    id: 'help',
    label: 'Help',
    items: [
        {
            id: 'guides',
            label: 'Guided Tours',
            icon: '🎓',
            children: [
                { id: 'tour-navigation', label: 'Navigation & Menus', href: '#tour-navigation', icon: '🧭', description: '~30s', onClick: 'startTour' },
                { id: 'tour-new-user', label: 'Dashboard Basics', href: '#tour-new-user', icon: '🏠', description: '~30s', onClick: 'startTour' },
                { id: 'tour-member', label: 'How to Submit Steps', href: '#tour-member', icon: '📝', description: '~1m', onClick: 'startTour' },
                { id: 'tour-leaderboard', label: 'Leaderboard & Filters', href: '#tour-leaderboard', icon: '🏆', description: '~30s', onClick: 'startTour' },
                { id: 'tour-admin', label: 'League Owner Guide', href: '#tour-admin', icon: '👑', description: '~30s', onClick: 'startTour', visibleTo: ['admin', 'owner', 'superadmin'] },
            ]
        },
        { id: 'feedback', label: 'Send Feedback', href: '/feedback', icon: '💬' },
        { id: 'roadmap', label: 'Roadmap', href: '/roadmap', icon: '🗺️' },
        { id: 'beta-info', label: 'Beta Info', href: '/beta', icon: '📋' },
    ]
};

/**
 * User account menu
 */
export const USER_MENU: MenuDefinition = {
    id: 'user',
    items: [
        { id: 'profile-settings', label: 'Profile Settings', href: '/settings/profile', icon: '⚙️' },
        {
            id: 'sign-out',
            label: 'Sign Out',
            icon: '🚪',
            onClick: 'signOut',
            dividerBefore: true,
        },
    ]
};

/**
 * SuperAdmin menu
 */
export const ADMIN_MENU: MenuDefinition = {
    id: 'admin',
    label: 'Admin',
    items: [
        {
            id: 'admin-kanban',
            label: '📋 Kanban Board',
            href: '/admin/kanban',
            description: 'Task management',
            visibleTo: ['superadmin'],
        },
        {
            id: 'admin-design',
            label: '🎨 Design System',
            href: '/admin/design-system',
            description: 'Brand guidelines',
            visibleTo: ['superadmin'],
        },
        {
            id: 'admin-feedback',
            label: '💬 Feedback',
            href: '/admin/feedback',
            description: 'View user feedback',
            visibleTo: ['superadmin'],
        },
    ]
};

/**
 * Footer navigation column
 */
export const FOOTER_NAVIGATION: MenuDefinition = {
    id: 'footer-navigation',
    label: 'Navigation',
    items: [
        { id: 'footer-dashboard', label: 'Dashboard', href: '/dashboard' },
        { id: 'footer-create', label: 'Create League', href: '/league/create' },
        { id: 'footer-join', label: 'Join League', href: '/join' },
    ]
};

/**
 * Footer account column
 */
export const FOOTER_ACCOUNT: MenuDefinition = {
    id: 'footer-account',
    label: 'Account',
    items: [
        { id: 'footer-profile', label: 'Profile Settings', href: '/settings/profile' },
        { id: 'footer-feedback', label: 'Send Feedback', href: '/feedback' },
    ]
};

/**
 * Footer legal column
 */
export const FOOTER_LEGAL: MenuDefinition = {
    id: 'footer-legal',
    label: 'Legal',
    items: [
        { id: 'footer-terms', label: 'Terms of Service', href: '/terms' },
        { id: 'footer-privacy', label: 'Privacy Policy', href: '/privacy' },
        { id: 'footer-security', label: 'Security', href: '/security' },
        { id: 'footer-beta', label: 'Beta Info', href: '/beta' },
    ]
};

/**
 * All menus exported as a single object
 */
export const MENUS = {
    main: MAIN_MENU,
    help: HELP_MENU,
    user: USER_MENU,
    admin: ADMIN_MENU,
    footerNavigation: FOOTER_NAVIGATION,
    footerAccount: FOOTER_ACCOUNT,
    footerLegal: FOOTER_LEGAL,
} as const;

// ----------------------------
// Legacy Compatibility
// ----------------------------

// Re-export for backward compatibility with existing navigation.ts consumers
export const LEAGUE_MENU_ITEMS = MAIN_MENU.items.find(i => i.id === 'league')?.children ?? [];
export const ACTIONS_MENU_ITEMS = MAIN_MENU.items.find(i => i.id === 'actions')?.children ?? [];
export const FOOTER_LINKS = [...FOOTER_LEGAL.items, { id: 'roadmap', label: 'Roadmap', href: '/roadmap', icon: '🗺️' }];
