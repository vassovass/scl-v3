"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CancellationFlow } from "./CancellationFlow";
import type { SubscriptionStatus } from "@/lib/subscriptions/types";
import { formatCents } from "@/lib/subscriptions/types";

// ============================================================================
// Types
// ============================================================================

interface SubscriptionActionsProps {
  leagueId: string;
  status: SubscriptionStatus | "free";
  tierName: string;
  tierId: string;
  priceCents: number;
  currency?: string;
  memberLimit: number | null;
  currentMembers: number;
  periodEnd: string | null;
  billingInterval: "monthly" | "annual" | null;
  canceledAt: string | null;
  onUpdate: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SubscriptionActions — Upgrade/downgrade/cancel/pause/resume buttons.
 * PRD 76: Subscription Management & Grandfathering
 */
export function SubscriptionActions({
  leagueId,
  status,
  tierName,
  priceCents,
  currency = "ZAR",
  memberLimit,
  currentMembers,
  periodEnd,
  canceledAt,
  onUpdate,
}: SubscriptionActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (
    action: "reactivate" | "pause" | "resume",
    endpoint: string,
    body: Record<string, unknown>,
    successMessage: string
  ) => {
    setLoading(action);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || successMessage);
        onUpdate();
      } else {
        toast.error(data.error || `Failed to ${action}`);
      }
    } catch {
      toast.error(`Failed to ${action}`);
    } finally {
      setLoading(null);
    }
  };

  const isCanceled = status === "canceled";
  const isPaused = status === "paused";
  const isActive = status === "active" || status === "trialing";
  const isPastDue = status === "past_due";

  return (
    <div className="space-y-4">
      {/* Status display */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Status:</span>
        <StatusBadge status={status} />
        {isCanceled && periodEnd && (
          <span className="text-xs text-muted-foreground">
            Access until {new Date(periodEnd).toLocaleDateString("en-GB")}
          </span>
        )}
      </div>

      {/* Price info */}
      {status !== "free" && (
        <div className="text-sm text-muted-foreground">
          {tierName} - {formatCents(priceCents, currency)}/mo
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Reactivate (only for canceled, before period end) */}
        {isCanceled && periodEnd && new Date(periodEnd) > new Date() && (
          <button
            onClick={() =>
              handleAction(
                "reactivate",
                "/api/subscriptions/reactivate",
                { league_id: leagueId },
                "Subscription reactivated"
              )
            }
            disabled={loading === "reactivate"}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading === "reactivate" ? "Reactivating..." : "Reactivate"}
          </button>
        )}

        {/* Pause (only for active) */}
        {isActive && (
          <button
            onClick={() =>
              handleAction(
                "pause",
                "/api/subscriptions/pause",
                { league_id: leagueId, pause_days: 30 },
                "Subscription paused"
              )
            }
            disabled={loading === "pause"}
            className="px-4 py-2 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 text-foreground text-sm transition-colors"
          >
            {loading === "pause" ? "Pausing..." : "Pause (30 days)"}
          </button>
        )}

        {/* Resume (only for paused) */}
        {isPaused && (
          <button
            onClick={() =>
              handleAction(
                "resume",
                "/api/subscriptions/resume",
                { league_id: leagueId },
                "Subscription resumed"
              )
            }
            disabled={loading === "resume"}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading === "resume" ? "Resuming..." : "Resume subscription"}
          </button>
        )}

        {/* Cancel (only for active or past_due) */}
        {(isActive || isPastDue) && (
          <button
            onClick={() => setCancelOpen(true)}
            className="px-4 py-2 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm transition-colors"
          >
            Cancel subscription
          </button>
        )}
      </div>

      {/* Cancellation flow modal */}
      <CancellationFlow
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        leagueId={leagueId}
        tierName={tierName}
        priceCents={priceCents}
        currency={currency}
        memberLimit={memberLimit}
        currentMembers={currentMembers}
        periodEnd={periodEnd}
        onCanceled={onUpdate}
      />
    </div>
  );
}

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: SubscriptionStatus | "free" }) {
  const config: Record<string, { label: string; className: string }> = {
    free: {
      label: "Free",
      className: "bg-muted text-muted-foreground",
    },
    active: {
      label: "Active",
      className: "bg-green-500/10 text-green-700 dark:text-green-400",
    },
    trialing: {
      label: "Trial",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },
    past_due: {
      label: "Past Due",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    paused: {
      label: "Paused",
      className: "bg-muted text-muted-foreground",
    },
    canceled: {
      label: "Canceled",
      className: "bg-red-500/10 text-red-700 dark:text-red-400",
    },
    expired: {
      label: "Expired",
      className: "bg-red-500/10 text-red-700 dark:text-red-400",
    },
  };

  const { label, className } = config[status] || config.free;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
