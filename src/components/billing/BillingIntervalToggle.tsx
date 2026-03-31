"use client";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/Badge";

/**
 * BillingIntervalToggle — Monthly/Annual toggle with savings badge.
 * PRD 75: Pay Gate UI & Enforcement
 */

interface BillingIntervalToggleProps {
  interval: "monthly" | "annual";
  onIntervalChange: (interval: "monthly" | "annual") => void;
  /** Optional savings percentage to show on the annual badge */
  savingsPercent?: number;
}

export function BillingIntervalToggle({
  interval,
  onIntervalChange,
  savingsPercent,
}: BillingIntervalToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`text-sm font-medium transition-colors ${
          interval === "monthly" ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        Monthly
      </span>
      <Switch
        checked={interval === "annual"}
        onCheckedChange={(checked) =>
          onIntervalChange(checked ? "annual" : "monthly")
        }
        aria-label="Toggle billing interval"
      />
      <span
        className={`text-sm font-medium transition-colors ${
          interval === "annual" ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        Annual
      </span>
      {savingsPercent && savingsPercent > 0 && (
        <Badge variant="secondary" className="text-xs">
          Save {savingsPercent}%
        </Badge>
      )}
    </div>
  );
}
