"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, PieChart, Users, Trophy } from "lucide-react";

/**
 * Analytics Navigation Component
 * 
 * Horizontal tab navigation for analytics modules.
 * Extensible - add new modules by adding to the tabs array.
 */

interface AnalyticsTab {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    description?: string;
}

const analyticsTabs: AnalyticsTab[] = [
    {
        id: "overview",
        label: "Overview",
        href: "/admin/analytics",
        icon: <BarChart3 className="h-4 w-4" />,
        description: "Platform KPIs and summary",
    },
    {
        id: "tours",
        label: "Tours",
        href: "/admin/analytics/tours",
        icon: <PieChart className="h-4 w-4" />,
        description: "Onboarding tour performance",
    },
    // Future modules (PRD 32):
    // {
    //     id: "engagement",
    //     label: "Engagement",
    //     href: "/admin/analytics/engagement",
    //     icon: <Users className="h-4 w-4" />,
    //     description: "User activity and retention",
    // },
    // {
    //     id: "leagues",
    //     label: "Leagues",
    //     href: "/admin/analytics/leagues",
    //     icon: <Trophy className="h-4 w-4" />,
    //     description: "League performance metrics",
    // },
];

export function AnalyticsNav() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/admin/analytics") {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <nav className="border-b border-border">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {analyticsTabs.map((tab) => (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap",
                            "border-b-2 transition-colors",
                            isActive(tab.href)
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
