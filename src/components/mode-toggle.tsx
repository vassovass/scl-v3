"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserTheme } from "@/hooks/useUserTheme";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { ThemeMode } from "@/lib/settings/themeSettings";

/**
 * ModeToggle - Theme selector dropdown (Light/Dark/System)
 *
 * Displays current theme icon and allows switching between modes.
 * Uses useUserTheme hook for database-synced theme persistence.
 */
export function ModeToggle() {
    const { theme } = useTheme(); // For display only
    const { updateTheme } = useUserTheme(); // For database sync
    const { allowedModes } = useThemeSettings();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch by only rendering after mount
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return placeholder with same dimensions to prevent layout shift
        return (
            <button
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground"
                aria-label="Toggle theme"
            >
                <Sun className="h-4 w-4" />
            </button>
        );
    }

    const items = [
        { value: "light", label: "Light", icon: Sun, comingSoon: "Light mode coming soon" },
        { value: "dark", label: "Dark", icon: Moon, comingSoon: "Dark mode coming soon" },
        { value: "system", label: "System", icon: Monitor, comingSoon: "System mode coming soon" },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                    aria-label="Toggle theme"
                >
                    {/* GPU-accelerated transitions to prevent INP blocking */}
                    <Sun className="h-4 w-4 opacity-100 dark:opacity-0 transition-opacity duration-150" style={{ willChange: 'opacity' }} />
                    <Moon className="absolute h-4 w-4 opacity-0 dark:opacity-100 transition-opacity duration-150" style={{ willChange: 'opacity' }} />
                    <span className="sr-only">Toggle theme</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isAllowed = allowedModes.includes(item.value as ThemeMode);
                    const isDisabled = !isAllowed;
                    return (
                        <DropdownMenuItem
                            key={item.value}
                            onClick={() => {
                                if (!isDisabled) {
                                    updateTheme(item.value as ThemeMode);
                                }
                            }}
                            disabled={isDisabled}
                            title={isDisabled ? item.comingSoon : undefined}
                            className={[
                                theme === item.value ? "bg-accent" : "",
                                isDisabled ? "text-muted-foreground opacity-60" : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.label}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
