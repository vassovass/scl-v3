"use client";

import { Suspense } from "react";
import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

export default function SecurityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <div className="min-h-screen flex flex-col">
                <NavHeader />
                <main className="flex-1">{children}</main>
                <GlobalFooter />
            </div>
        </Suspense>
    );
}

