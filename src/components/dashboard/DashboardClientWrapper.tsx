"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

/**
 * Client wrapper for dashboard pages that prevents data leakage during sign-out.
 * Shows loading state when sign-out is in progress to avoid flashing user data.
 *
 * Uses useRouter().replace() instead of redirect() for client-side navigation.
 * redirect() from next/navigation throws NEXT_REDIRECT during render which can
 * crash the React tree if caught by an error boundary.
 */
export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  const { loading, isSigningOut, session } = useAuth();
  const router = useRouter();

  // Client-side safety redirect (defense-in-depth — server already checks in middleware)
  useEffect(() => {
    if (!loading && !isSigningOut && !session) {
      router.replace('/sign-in');
    }
  }, [loading, isSigningOut, session, router]);

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

  // Show spinner while useEffect redirect fires
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
