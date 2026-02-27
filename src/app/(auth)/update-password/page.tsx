"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { analytics } from "@/lib/analytics";

/** Password strength scoring (NIST-aligned: no forced complexity, length-based with variety bonus) */
export function getPasswordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (pw.length < 8) return { score: 0, label: "Too short", color: "hsl(var(--destructive))" };

  let score: 0 | 1 | 2 | 3 | 4 = 1;
  const hasMixedCase = /[A-Z]/.test(pw) && /[a-z]/.test(pw);
  const hasNumbersOrSymbols = /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);

  if (pw.length >= 12 || hasMixedCase) score = 2;
  if (pw.length >= 12 && hasMixedCase) score = 3;
  if (pw.length >= 12 && hasMixedCase && hasNumbersOrSymbols) score = 4;

  const levels: Record<number, { label: string; color: string }> = {
    1: { label: "Weak", color: "hsl(var(--warning))" },
    2: { label: "Fair", color: "hsl(var(--warning))" },
    3: { label: "Good", color: "hsl(var(--success))" },
    4: { label: "Strong", color: "hsl(var(--success))" },
  };

  return { score, ...levels[score] };
}

function UpdatePasswordForm() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= 8 && passwordsMatch && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

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

    analytics.passwordResetCompleted();
    router.push("/dashboard?password_updated=true");
    router.refresh();
  };

  // Still checking auth state
  if (authLoading) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="text-muted-foreground">Verifying reset link...</p>
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
          <Link
            href="/reset-password"
            className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Request a new reset link
          </Link>
          <Link
            href="/sign-in"
            className="block w-full text-center text-sm text-muted-foreground hover:text-primary transition"
          >
            Back to sign in
          </Link>
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
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="••••••••"
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !isValid}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
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
