"use client";

import { Suspense } from "react";
import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { TourProvider } from "@/components/tours/TourProvider";
import AIChatPanel from "@/components/admin/AIChatPanel";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <TourProvider userRole="admin">
                <div className="min-h-screen flex flex-col">
                    <NavHeader />
                    <main className="flex-1">{children}</main>
                    <GlobalFooter />
                    <AIChatPanel />
                </div>
            </TourProvider>
        </Suspense>
    );
}

