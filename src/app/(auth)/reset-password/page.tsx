"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { analytics } from "@/lib/analytics";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "link_expired";

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
    });

    if (resetError) {
      // Detect Supabase rate limiting (1 email per 60s per address)
      const msg = resetError.message.toLowerCase();
      if (
        resetError.status === 429 ||
        msg.includes("security purposes") ||
        msg.includes("60 seconds") ||
        msg.includes("rate")
      ) {
        setError("Please wait a minute before requesting another reset link.");
        setLoading(false);
        return;
      }

      // NIST: Never reveal if email exists — show success anyway for other errors
      // Only show actual error for unexpected failures
      console.error("[ResetPassword]", resetError.message);
    }

    // Always show success (NIST 800-63B: never reveal if email exists)
    analytics.passwordResetRequested();
    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-center text-2xl font-bold text-foreground">
        Reset your password
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {linkExpired && !success && (
        <div className="mt-6 rounded-lg border border-[hsl(var(--warning)/0.5)] bg-[hsl(var(--warning)/0.1)] px-4 py-3 text-sm text-[hsl(var(--warning))]">
          Your reset link has expired. Please request a new one below.
        </div>
      )}

      {success ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-[hsl(var(--success)/0.2)] bg-[hsl(var(--success)/0.1)] px-4 py-3 text-sm text-[hsl(var(--success))]">
            Check your email for a reset link. If you don&apos;t see it, check your spam folder.
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="text-primary hover:text-primary/80">
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/sign-in" className="text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
