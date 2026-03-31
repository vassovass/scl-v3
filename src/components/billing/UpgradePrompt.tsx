"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BillingIntervalToggle } from "./BillingIntervalToggle";
import { PricingCard } from "./PricingCard";
import { Spinner } from "@/components/ui/Spinner";
import { trackEvent } from "@/lib/analytics";
import type { SubscriptionTier } from "@/lib/subscriptions/types";

/**
 * UpgradePrompt — Dialog shown when a blocked action is attempted.
 * Lists available paid tiers with billing toggle and checkout CTA.
 * PRD 75: Pay Gate UI & Enforcement
 */

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: string;
  /** Optional: the current tier slug so we can mark it */
  currentTierSlug?: string;
}

export function UpgradePrompt({
  open,
  onOpenChange,
  leagueId,
  currentTierSlug,
}: UpgradePromptProps) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch tiers
  const fetchTiers = useCallback(async () => {
    try {
      setIsLoadingTiers(true);
      const response = await fetch("/api/subscription-tiers");
      if (!response.ok) throw new Error("Failed to load pricing");
      const data = await response.json();
      setTiers(data.tiers || []);
    } catch {
      setError("Could not load pricing plans. Please try again.");
    } finally {
      setIsLoadingTiers(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchTiers();
      trackEvent("upgrade_prompt_opened", {
        league_id: leagueId,
        category: "conversion",
      });
    }
  }, [open, fetchTiers, leagueId]);

  // Filter to paid tiers only (exclude free and enterprise/contact)
  const paidTiers = tiers.filter(
    (t) => t.monthly_price_cents > 0 && t.member_limit !== null
  );

  // Calculate savings percentage for toggle
  const savingsPercent = paidTiers.length > 0
    ? Math.round(
        ((paidTiers[0].monthly_price_cents * 12 - paidTiers[0].annual_price_cents) /
          (paidTiers[0].monthly_price_cents * 12)) *
          100
      )
    : 0;

  const handleSelectTier = async (tierId: string) => {
    try {
      setCheckoutLoading(tierId);
      setError(null);

      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league_id: leagueId,
          tier_id: tierId,
          billing_interval: billingInterval,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create checkout session");
      }

      const data = await response.json();

      trackEvent("checkout_session_created", {
        league_id: leagueId,
        tier_id: tierId,
        billing_interval: billingInterval,
        category: "conversion",
      });

      // Redirect to Paystack checkout
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Upgrade Your League</DialogTitle>
          <DialogDescription>
            Choose a plan to unlock more members and features for your league.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoadingTiers ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : paidTiers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No paid plans are currently available.
          </p>
        ) : (
          <div className="space-y-6">
            <BillingIntervalToggle
              interval={billingInterval}
              onIntervalChange={setBillingInterval}
              savingsPercent={savingsPercent}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {paidTiers.map((tier) => (
                <PricingCard
                  key={tier.id}
                  tier={tier}
                  billingInterval={billingInterval}
                  isPopular={tier.slug === "standard"}
                  isCurrentTier={tier.slug === currentTierSlug}
                  onSelect={handleSelectTier}
                  isLoading={checkoutLoading === tier.id}
                />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
