"use client";

import { Suspense } from "react";
import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { TourProvider } from "@/components/tours/TourProvider";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <TourProvider>
                <div className="min-h-screen flex flex-col">
                    <NavHeader />
                    <main className="flex-1">{children}</main>
                    <GlobalFooter />
                </div>
            </TourProvider>
        </Suspense>
    );
}

