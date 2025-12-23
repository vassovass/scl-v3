/**
 * SuperAdmin Pages Configuration
 * 
 * Add new superadmin-only pages here and they will automatically
 * appear in the NavHeader dropdown and mobile menu.
 * 
 * When adding a new admin page:
 * 1. Create the page in src/app/admin/[page-name]/page.tsx
 * 2. Add it to this array
 * 3. The menu updates automatically!
 */

export interface AdminPage {
    /** URL path (relative to /admin) */
    href: string;
    /** Display label with emoji */
    label: string;
    /** Short description (optional, for documentation) */
    description?: string;
}

export const SUPERADMIN_PAGES: AdminPage[] = [
    {
        href: "/admin/design-system",
        label: "🎨 Design System",
        description: "Brand guidelines, component library, and UI patterns",
    },
    {
        href: "/admin/feedback",
        label: "💬 Feedback",
        description: "View user feedback and bug reports",
    },
    // Add more superadmin pages here:
    // {
    //     href: "/admin/users",
    //     label: "👥 User Management",
    //     description: "View and manage all users",
    // },
    // {
    //     href: "/admin/analytics",
    //     label: "📊 Global Analytics",
    //     description: "App-wide usage statistics",
    // },
];
