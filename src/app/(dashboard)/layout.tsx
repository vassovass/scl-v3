"use client";

import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { OnboardingProvider } from "@/components/providers/OnboardingProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OnboardingProvider>
            <div className="min-h-screen flex flex-col">
                <NavHeader />
                <main className="flex-1">{children}</main>
                <GlobalFooter />
            </div>
        </OnboardingProvider>
    );
}
