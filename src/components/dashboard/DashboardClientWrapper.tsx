"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { redirect } from "next/navigation";

/**
 * Client wrapper for dashboard pages that prevents data leakage during sign-out.
 * Shows loading state when sign-out is in progress to avoid flashing user data.
 */
export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  const { loading, isSigningOut, session } = useAuth();

  // Show loading during auth init OR sign-out
  if (loading || isSigningOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isSigningOut ? "Signing out..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Client-side safety check (server-side already checked, this is defense-in-depth)
  if (!session) {
    redirect('/sign-in');
  }

  return <>{children}</>;
}
