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

/**
 * ModeToggle - Theme selector dropdown (Light/Dark/System)
 *
 * Displays current theme icon and allows switching between modes.
 * Uses useUserTheme hook for database-synced theme persistence.
 */
export function ModeToggle() {
    const { theme } = useTheme(); // For display only
    const { updateTheme } = useUserTheme(); // For database sync
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
                <DropdownMenuItem
                    onClick={() => updateTheme("light")}
                    className={theme === "light" ? "bg-accent" : ""}
                >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => updateTheme("dark")}
                    className={theme === "dark" ? "bg-accent" : ""}
                >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => updateTheme("system")}
                    className={theme === "system" ? "bg-accent" : ""}
                >
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
