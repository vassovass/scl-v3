import { SUPERADMIN_PAGES } from "./adminPages";

export interface NavItem {
    label: string;
    href: string;
    icon?: string;
    description?: string;
    external?: boolean;
    children?: NavItem[]; // Support for nested submenus
}

export interface NavSection {
    title?: string;
    items: NavItem[];
}

export const MENU_LIMIT_WARNING_THRESHOLD = 7;

/**
 * Validates menu size and logs a warning if it exceeds best practices.
 */
export function validateMenuSize(menuName: string, items: NavItem[]) {
    // Only warn for top-level items, children don't count towards the immediate clutter
    if (items.length > MENU_LIMIT_WARNING_THRESHOLD) {
        console.warn(
            `[UX Warning] The "${menuName}" menu has ${items.length} items, which exceeds the recommended limit of ${MENU_LIMIT_WARNING_THRESHOLD}. Consider grouping items or removing less important ones.`
        );
    }
}

// --- Menu Definitions ---

export const LEAGUE_MENU_ITEMS: NavItem[] = [
    { label: "Submit Steps", href: "/league/[id]", icon: "📝" },
    { label: "Leaderboard", href: "/league/[id]/leaderboard", icon: "🏆" },
    { label: "Analytics", href: "/league/[id]/analytics", icon: "📊" },
];

export const ACTIONS_MENU_ITEMS: NavItem[] = [
    { label: "Create League", href: "/league/create", icon: "➕" },
    { label: "Join League", href: "/join", icon: "🔗" },
    {
        label: "Help & Guides",
        href: "#", // Parent item wrapper
        icon: "🧭",
        description: "Interactive tours ✨",
        children: [
            { label: "Navigation & Menus", href: "#tour-navigation", icon: "🧭", description: "~30s" },
            { label: "Dashboard Basics", href: "#tour-new-user", icon: "🏠", description: "~30s" },
            { label: "How to Submit Steps", href: "#tour-member", icon: "📝", description: "~1m" },
            { label: "Leaderboard & Filters", href: "#tour-leaderboard", icon: "🏆", description: "~30s" },
            { label: "League Owner Guide", href: "#tour-admin", icon: "👑", description: "~30s" },
        ]
    }
];

export const USER_MENU_SECTIONS: NavSection[] = [
    {
        items: [
            { label: "Profile Settings", href: "/settings/profile", icon: "⚙️" },
            { label: "Send Feedback", href: "/feedback", icon: "💬" },
        ]
    }
];

export const FOOTER_LINKS: NavItem[] = [
    { label: "Beta Info", href: "/beta", icon: "📋" },
    { label: "Privacy Policy", href: "/privacy", icon: "🔒" },
];

// Re-export superadmin pages for consistency
export { SUPERADMIN_PAGES };
