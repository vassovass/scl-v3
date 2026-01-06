"use client";

import { Suspense } from "react";
import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { OnboardingProvider } from "@/components/providers/OnboardingProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <OnboardingProvider>
                <div className="min-h-screen flex flex-col bg-background">
                    <NavHeader />
                    <main className="flex-1">{children}</main>
                    <GlobalFooter />
                </div>
            </OnboardingProvider>
        </Suspense>
    );
}
