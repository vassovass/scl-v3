"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCents } from "@/lib/subscriptions/types";

// ============================================================================
// Types
// ============================================================================

interface CancellationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: string;
  tierName: string;
  priceCents: number;
  currency?: string;
  memberLimit: number | null;
  currentMembers: number;
  periodEnd: string | null;
  onCanceled: () => void;
}

const CANCELLATION_REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_using", label: "Not using it enough" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "found_alternative", label: "Found an alternative" },
  { value: "league_ended", label: "League/competition ended" },
  { value: "temporary", label: "Temporary break" },
  { value: "other", label: "Other" },
];

// ============================================================================
// Component
// ============================================================================

/**
 * CancellationFlow — Modal with retention prompts and exit survey.
 * PRD 76: Subscription Management & Grandfathering
 */
export function CancellationFlow({
  open,
  onOpenChange,
  leagueId,
  tierName,
  priceCents,
  currency = "ZAR",
  memberLimit,
  currentMembers,
  periodEnd,
  onCanceled,
}: CancellationFlowProps) {
  const [step, setStep] = useState<"retention" | "survey" | "confirm">("retention");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league_id: leagueId,
          reason: reason || undefined,
          exit_survey: {
            category: reason || undefined,
            feedback: feedback || undefined,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Subscription canceled");
        onCanceled();
        onOpenChange(false);
      } else {
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch {
      toast.error("Failed to cancel subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep("retention");
    setReason("");
    setFeedback("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        {step === "retention" && (
          <>
            <DialogHeader>
              <DialogTitle>Before you go...</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                You are about to cancel your <strong className="text-foreground">{tierName}</strong> plan
                ({formatCents(priceCents, currency)}/mo).
              </p>

              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">What you will lose:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {memberLimit && (
                    <li>
                      Member limit drops to 3 (you currently have {currentMembers})
                    </li>
                  )}
                  <li>Premium features (analytics, custom goals, etc.)</li>
                  <li>Priority support access</li>
                </ul>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Consider instead:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    <button
                      onClick={resetAndClose}
                      className="text-primary hover:underline"
                    >
                      Downgrade to a lower plan
                    </button>{" "}
                    — keep some features at a lower price
                  </li>
                  <li>
                    <button
                      onClick={resetAndClose}
                      className="text-primary hover:underline"
                    >
                      Pause your subscription
                    </button>{" "}
                    — take a break without losing your price
                  </li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={resetAndClose}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
              >
                Keep my plan
              </button>
              <button
                onClick={() => setStep("survey")}
                className="w-full sm:w-auto px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-foreground text-sm transition-colors"
              >
                Continue canceling
              </button>
            </DialogFooter>
          </>
        )}

        {step === "survey" && (
          <>
            <DialogHeader>
              <DialogTitle>Help us improve</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Why are you canceling? (optional)
              </p>

              <div className="space-y-2">
                {CANCELLATION_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">{r.label}</span>
                  </label>
                ))}
              </div>

              <textarea
                placeholder="Any additional feedback? (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => setStep("retention")}
                className="w-full sm:w-auto px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-foreground text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium transition-colors"
              >
                Continue
              </button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm cancellation</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Your subscription will be canceled, but you will retain access until{" "}
                <strong className="text-foreground">
                  {periodEnd
                    ? new Date(periodEnd).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "the end of your billing period"}
                </strong>
                .
              </p>
              <p className="text-sm text-muted-foreground">
                You can reactivate your subscription any time before that date.
              </p>
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={resetAndClose}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
              >
                Keep my plan
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {submitting ? "Canceling..." : "Cancel subscription"}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
