"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function PasswordResetSuccessToast() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const passwordUpdated = searchParams.get("password_updated") === "true";

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
