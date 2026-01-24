"use client";

import { Suspense } from "react";
import { NavHeader } from "@/components/navigation/NavHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { TourProvider } from "@/components/tours/TourProvider";
import { ActingAsBanner } from "@/components/auth/ProfileSwitcher";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { useAuth } from "@/components/providers/AuthProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSigningOut, loading, user, activeProfile } = useAuth();

    // Show loading spinner during sign-out to prevent data leakage
    if (isSigningOut) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Signing out...</p>
                </div>
            </div>
        );
    }

    // Show loading spinner during initial auth check
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    // Determine user role for tour visibility
    const isAdmin = activeProfile?.is_superadmin === true;

    return (
        <Suspense fallback={null}>
            <TourProvider
                userId={user?.id}
                userRole={isAdmin ? 'admin' : 'member'}
            >
                <div className="min-h-screen flex flex-col bg-background">
                    <NavHeader />
                    {/* Auth error alert - single source of truth from AuthProvider */}
                    <AuthErrorAlert />
                    {/* PRD 41: Show banner when acting as a proxy */}
                    <ActingAsBanner />
                    <main className="flex-1">{children}</main>
                    <GlobalFooter />
                </div>
            </TourProvider>
        </Suspense>
    );
}

