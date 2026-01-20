"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
    label: string;
    href: string;
    description?: string;
}

interface SettingsNavProps {
    items: NavItem[];
    className?: string;
}

/**
 * Tabbed navigation for settings pages
 * Works for user settings, league settings, and admin settings
 */
export function SettingsNav({ items, className }: SettingsNavProps) {
    const pathname = usePathname();

    return (
        <nav className={cn("border-b border-border", className)}>
            <div className="flex gap-2 overflow-x-auto pb-px">
                {items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors hover:text-foreground",
                                isActive
                                    ? "border-primary text-foreground"
                                    : "border-transparent text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

