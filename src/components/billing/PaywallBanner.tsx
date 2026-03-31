"use client";

import { useState, useEffect } from "react";
import { usePayGate } from "@/hooks/usePayGate";
import { useLeagueSubscription } from "@/hooks/useLeagueSubscription";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/**
 * PaywallBanner — Inline banner shown when a league is at free tier capacity.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * "Your league has X/Y members. Upgrade to add more."
 * Hidden when pay gate is disabled or when dismissed.
 */

interface PaywallBannerProps {
  leagueId: string;
  onUpgradeClick?: () => void;
}

export function PaywallBanner({ leagueId, onUpgradeClick }: PaywallBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { isAtCapacity, currentMembers, memberLimit, payGateOverride, isLoading: subLoading } =
    useLeagueSubscription(leagueId);
  const { isPayGateActive, isLoading: gateLoading } = usePayGate(payGateOverride);

  const isLoading = subLoading || gateLoading;
  const shouldShow = !isDismissed && !isLoading && isPayGateActive && isAtCapacity;

  // Track impression
  useEffect(() => {
    if (shouldShow) {
      trackEvent("paywall_banner_shown", {
        league_id: leagueId,
        current_members: currentMembers,
        member_limit: memberLimit,
        category: "conversion",
      });
    }
  }, [shouldShow, leagueId, currentMembers, memberLimit]);

  if (!shouldShow) return null;

  return (
    <div className="relative rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Your league has{" "}
            <span className="font-bold text-primary">
              {currentMembers}/{memberLimit}
            </span>{" "}
            members.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upgrade to add more members and unlock additional features.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={onUpgradeClick}
            className="text-xs"
          >
            Upgrade
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
