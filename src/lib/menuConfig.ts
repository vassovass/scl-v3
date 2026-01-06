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
// Menu Locations (WordPress-style)
// ----------------------------

/**
 * Menu location types - where menus can be displayed
 * Similar to WordPress menu locations (Primary, Footer, etc.)
 */
export type MenuLocation =
    | 'public_header'    // Public/marketing pages (/, /privacy, /terms, /beta)
    | 'app_header'       // Authenticated app pages (/dashboard, /league/*)
    | 'admin_header'     // Admin pages (/admin/*)
    | 'footer';          // Global footer (all pages)

/**
 * Configuration for each menu location
 */
export interface MenuLocationConfig {
    /** Which menu IDs to display at this location */
    menus: (keyof typeof MENUS)[];
    /** Show the logo */
    showLogo: boolean;
    /** Show sign-in button for non-authenticated users */
    showSignIn: boolean;
    /** Show user menu for authenticated users */
    showUserMenu: boolean;
    /** Show admin menu for superadmins */
    showAdminMenu: boolean;
    /** Optional: CSS class to add to the header */
    className?: string;
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
 * Main navigation menu (Dashboard, League, Actions, Roadmap)
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
            id: 'world-leaderboard',
            label: 'World Leaderboard',
            href: '/leaderboard',
            icon: '🌍',
        },
        {
            id: 'league',
            label: 'League',
            icon: '🏆',
            requiresLeague: true,
            children: [
                { id: 'league-submit', label: 'Submit Steps', href: '/submit-steps', icon: '📝' },
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
        {
            id: 'roadmap',
            label: 'Roadmap',
            href: '/roadmap',
            icon: '🗺️',
            // Visible to ALL users including guests
            visibleTo: ['guest', 'member', 'admin', 'owner', 'superadmin'],
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
        { id: 'footer-leaderboard', label: 'World Leaderboard', href: '/leaderboard' },
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
 * Public/Marketing header menu (for non-authenticated pages)
 * Shown on: /, /privacy, /terms, /security, /beta
 */
export const PUBLIC_MENU: MenuDefinition = {
    id: 'public',
    items: [
        { id: 'public-features', label: 'Features', href: '/#features', icon: '✨', visibleTo: ['guest', 'member', 'admin', 'owner', 'superadmin'] },
        { id: 'public-roadmap', label: 'Roadmap', href: '/roadmap', icon: '🗺️', visibleTo: ['guest', 'member', 'admin', 'owner', 'superadmin'] },
        { id: 'public-beta', label: 'Beta Info', href: '/beta', icon: '🚧', visibleTo: ['guest', 'member', 'admin', 'owner', 'superadmin'] },
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
    public: PUBLIC_MENU,
    footerNavigation: FOOTER_NAVIGATION,
    footerAccount: FOOTER_ACCOUNT,
    footerLegal: FOOTER_LEGAL,
} as const;

// ----------------------------
// Menu Locations Configuration
// ----------------------------

/**
 * Configuration for each menu location
 * Defines which menus appear where and what UI elements to show
 */
export const MENU_LOCATIONS: Record<MenuLocation, MenuLocationConfig> = {
    public_header: {
        menus: ['public'],
        showLogo: true,
        showSignIn: true,
        showUserMenu: true,      // Show if logged in
        showAdminMenu: true,     // Show if superadmin
    },
    app_header: {
        menus: ['main', 'help'],
        showLogo: true,
        showSignIn: true,
        showUserMenu: true,
        showAdminMenu: true,
    },
    admin_header: {
        menus: ['main', 'help'],
        showLogo: true,
        showSignIn: true,
        showUserMenu: true,
        showAdminMenu: true,
        className: 'admin-header',
    },
    footer: {
        menus: ['footerNavigation', 'footerAccount', 'footerLegal'],
        showLogo: true,
        showSignIn: false,
        showUserMenu: false,
        showAdminMenu: false,
    },
};

/**
 * Detect menu location based on pathname
 * Used by NavHeader to auto-select appropriate menu configuration
 */
export function detectMenuLocation(pathname: string): MenuLocation {
    // Admin pages
    if (pathname.startsWith('/admin')) {
        return 'admin_header';
    }

    // App pages (authenticated user areas)
    if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/league') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/join')
    ) {
        return 'app_header';
    }

    // Public/marketing pages
    const publicPages = ['/', '/privacy', '/terms', '/security', '/beta', '/roadmap', '/feedback'];
    if (publicPages.includes(pathname) || publicPages.some(p => pathname === p)) {
        return 'public_header';
    }

    // Default to app header for unknown pages
    return 'app_header';
}

/**
 * Get menu configuration for a location
 */
export function getMenuConfig(location: MenuLocation): MenuLocationConfig {
    return MENU_LOCATIONS[location];
}

// ----------------------------
// Legacy Compatibility
// ----------------------------

// Re-export for backward compatibility with existing navigation.ts consumers
export const LEAGUE_MENU_ITEMS = MAIN_MENU.items.find(i => i.id === 'league')?.children ?? [];
export const ACTIONS_MENU_ITEMS = MAIN_MENU.items.find(i => i.id === 'actions')?.children ?? [];
export const FOOTER_LINKS = [...FOOTER_LEGAL.items, { id: 'roadmap', label: 'Roadmap', href: '/roadmap', icon: '🗺️' }];

