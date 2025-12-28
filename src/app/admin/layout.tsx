"use client";

import { Suspense } from "react";
import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { OnboardingProvider } from "@/components/providers/OnboardingProvider";
import AIChatPanel from "@/components/admin/AIChatPanel";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <OnboardingProvider>
                <div className="min-h-screen flex flex-col">
                    <NavHeader />
                    <main className="flex-1">{children}</main>
                    <GlobalFooter />
                    <AIChatPanel />
                </div>
            </OnboardingProvider>
        </Suspense>
    );
}
