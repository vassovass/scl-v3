"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient as createArgsClient } from "@supabase/supabase-js";
import { useAuth } from "@/components/providers/AuthProvider";
import { analytics } from "@/lib/analytics";
import { getPasswordStrength } from "@/lib/utils/passwordStrength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RECOVERY_KEY = "password_recovery";

function UpdatePasswordForm() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState<boolean | null>(null);

  // Check if user arrived via password recovery flow
  useEffect(() => {
    if (authLoading) return;
    const flag = sessionStorage.getItem(RECOVERY_KEY);
    setIsRecoveryFlow(flag === "1");
  }, [authLoading]);

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= 8 && passwordsMatch && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);

    // Use a stateless client to bypass Web Locks deadlock (see AuthProvider fallback).
    // The singleton Supabase client can get stuck when INITIAL_SESSION doesn't fire.
    const accessToken = session?.access_token;
    if (!accessToken) {
      setError("Session expired. Please request a new reset link.");
      setLoading(false);
      return;
    }

    const statelessClient = createArgsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }
    );

    const updatePromise = statelessClient.auth.updateUser({ password });
    const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ error: { message: "Request timed out. Please try again." } }), 15000)
    );
    const { error: updateError } = await Promise.race([updatePromise, timeoutPromise]);

    if (updateError) {
      const msg = updateError.message.toLowerCase();
      if (msg.includes("same password") || msg.includes("different password")) {
        setError("New password must be different from your current password.");
      } else if (msg.includes("weak") || msg.includes("short")) {
        setError("Password is too weak. Please use at least 8 characters.");
      } else {
        setError(updateError.message);
      }
      setLoading(false);
      return;
    }

    // Clear recovery flag so refresh won't show the form again
    sessionStorage.removeItem(RECOVERY_KEY);
    analytics.passwordResetCompleted();
    setSuccess(true);
    setLoading(false);
  };

  // Still checking auth state or recovery flag
  if (authLoading || isRecoveryFlow === null) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="text-muted-foreground">Verifying reset link...</p>
      </div>
    );
  }

  // Password updated successfully
  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Password updated</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been changed successfully.
          </p>
        </div>
        <div className="mt-8">
          <Button asChild className="w-full">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // No valid session — link expired or user navigated directly
  if (!session) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-foreground">
          Link expired
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          This password reset link has expired or is invalid.
        </p>
        <div className="mt-8 space-y-3">
          <Button asChild className="w-full">
            <Link href="/reset-password">Request a new reset link</Link>
          </Button>
          <Button asChild variant="link" className="w-full text-muted-foreground">
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  // User is logged in but didn't arrive via recovery flow (e.g. typed URL directly)
  if (!isRecoveryFlow) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-foreground">
          No reset in progress
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          To change your password, request a reset link first.
        </p>
        <div className="mt-8 space-y-3">
          <Button asChild className="w-full">
            <Link href="/reset-password">Request a reset link</Link>
          </Button>
          <Button asChild variant="link" className="w-full text-muted-foreground">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-center text-2xl font-bold text-foreground">
        Set new password
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            New password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1"
            placeholder="••••••••"
          />
          {/* Password strength indicator */}
          {password.length > 0 && (
            <>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="h-1.5 flex-1 rounded-full transition-colors duration-200"
                    style={{
                      backgroundColor: level <= strength.score
                        ? strength.color
                        : "hsl(var(--muted))",
                    }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </>
          )}
          {password.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">At least 8 characters</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1"
            placeholder="••••••••"
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !isValid}
          className="w-full"
        >
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <Suspense fallback={<div className="text-muted-foreground">Verifying reset link...</div>}>
        <UpdatePasswordForm />
      </Suspense>
    </main>
  );
}
