"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENUS, prepareMenuItems, UserRole } from "@/lib/menuConfig";
import { analytics } from "@/lib/analytics";

interface LeagueNavProps {
    leagueId: string;
    userRole: UserRole;
}

/**
 * Horizontal tab navigation for league pages
 * Uses WordPress-style menuConfig for dynamic, admin-configurable navigation
 */
export function LeagueNav({ leagueId, userRole }: LeagueNavProps) {
    const pathname = usePathname();

    // Get menu items filtered by role with [id] resolved
    const navItems = prepareMenuItems(MENUS.league_nav.items, userRole, leagueId);

    const handleTabClick = (tabId: string, label: string) => {
        analytics.leagueNav?.tabClicked?.(leagueId, label);
    };

    return (
        <nav className="border-b border-border bg-card/50">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory -mb-px">
                    {navItems.map((item) => {
                        if (!item.href) return null;

                        // Check if this tab is active
                        const isActive =
                            pathname === item.href ||
                            (item.href.includes("/overview") && pathname === `/league/${leagueId}`);

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => handleTabClick(item.id, item.label)}
                                className={`
                  flex-shrink-0 snap-start px-4 py-3
                  text-sm font-medium transition-colors
                  border-b-2 whitespace-nowrap
                  ${isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                    }
                `}
                            >
                                {item.icon && <span className="mr-2">{item.icon}</span>}
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
