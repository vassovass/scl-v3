import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

/**
 * Waitlist Confirmation Page — /teams/waitlist
 *
 * Thank-you page shown after successful waitlist signup.
 *
 * PRD 34 — B2B Landing Pages
 */

export const metadata: Metadata = {
  title: "You're on the Waitlist! — StepLeague for Teams",
  description: "Thank you for joining the StepLeague for Teams waitlist.",
  robots: { index: false, follow: false },
};

export default function WaitlistConfirmationPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-8">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          You're on the List!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Thanks for your interest in StepLeague for Teams.
          We'll notify you as soon as we launch corporate wellness features.
        </p>

        <div className="bg-card border rounded-lg p-6 mb-8 text-left">
          <h2 className="font-semibold mb-3">What happens next?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] flex-shrink-0 mt-0.5" />
              <span>You'll receive an email when Teams launches</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] flex-shrink-0 mt-0.5" />
              <span>Early access members get priority onboarding</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] flex-shrink-0 mt-0.5" />
              <span>No spam — we'll only email about the launch</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/teams/features"
            className="px-5 py-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors font-medium text-sm"
          >
            Explore Features
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            Try StepLeague Free
          </Link>
        </div>
      </div>
    </div>
  );
}
