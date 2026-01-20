"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
    children: React.ReactNode;
    attribute?: "class" | "data-theme";
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
}

/**
 * ThemeProvider - Wrapper around next-themes for light/dark mode support
 * 
 * Uses `data-theme` attribute to match existing app styling system.
 */
export function ThemeProvider({
    children,
    attribute = "data-theme",
    defaultTheme = "dark",
    enableSystem = true,
    disableTransitionOnChange = false,
    ...props
}: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute={attribute}
            defaultTheme={defaultTheme}
            enableSystem={enableSystem}
            disableTransitionOnChange={disableTransitionOnChange}
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}

