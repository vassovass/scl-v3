"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

/**
 * Inner component that reads search params.
 * Must be wrapped in Suspense per hooks rule:
 * "useSearchParams — any component using it MUST be wrapped in <Suspense>"
 */
function PasswordResetSuccessToastInner() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  // Null-safe: useSearchParams() can return null during SSR/pre-rendering
  const passwordUpdated = searchParams?.get("password_updated") === "true";

  useEffect(() => {
    if (passwordUpdated) {
      const timer = setTimeout(() => {
        toast({
          title: "Password updated successfully",
          description: "You can now sign in with your new password.",
          duration: 5000,
        });
        // Clean up URL to remove query param
        window.history.replaceState({}, "", "/dashboard");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [passwordUpdated, toast]);

  return null;
}

export function PasswordResetSuccessToast() {
  return (
    <Suspense fallback={null}>
      <PasswordResetSuccessToastInner />
    </Suspense>
  );
}
