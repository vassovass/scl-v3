"use client";

import { Suspense } from "react";
import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { OnboardingProvider } from "@/components/providers/OnboardingProvider";
import { ActingAsBanner } from "@/components/auth/ProfileSwitcher";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";

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
                    {/* Auth error alert - single source of truth from AuthProvider */}
                    <AuthErrorAlert />
                    {/* PRD 41: Show banner when acting as a proxy */}
                    <ActingAsBanner />
                    <main className="flex-1">{children}</main>
                    <GlobalFooter />
                </div>
            </OnboardingProvider>
        </Suspense>
    );
}
