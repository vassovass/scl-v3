"use client";

import { Suspense } from "react";
import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

/**
 * Homepage layout with transparent nav overlay
 * The nav floats over the hero section for a sleek, immersive design
 */
export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <div className="min-h-screen flex flex-col">
                {/* Transparent nav overlays the hero section */}
                <NavHeader variant="transparent" />
                <main className="flex-1">{children}</main>
                <GlobalFooter />
            </div>
        </Suspense>
    );
}
