"use client";

import { useState, useEffect, useCallback } from "react";
import { PricingCard } from "./PricingCard";
import { BillingIntervalToggle } from "./BillingIntervalToggle";
import { Spinner } from "@/components/ui/Spinner";
import type { SubscriptionTier } from "@/lib/subscriptions/types";

/**
 * PricingTierGrid — Fetches tiers from API and renders PricingCards.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * Replaces the static pricing data on the public pricing page.
 */

export function PricingTierGrid() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  const fetchTiers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/subscription-tiers");
      if (!response.ok) throw new Error("Failed to load pricing");
      const data = await response.json();
      setTiers(data.tiers || []);
    } catch {
      setError("Could not load pricing plans. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // Calculate savings for toggle
  const paidTiers = tiers.filter((t) => t.monthly_price_cents > 0 && t.member_limit !== null);
  const savingsPercent =
    paidTiers.length > 0
      ? Math.round(
          ((paidTiers[0].monthly_price_cents * 12 - paidTiers[0].annual_price_cents) /
            (paidTiers[0].monthly_price_cents * 12)) *
            100
        )
      : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{error}</p>
        <button
          onClick={fetchTiers}
          className="mt-4 text-primary hover:text-primary/80 underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-16">
        Pricing plans are not yet available.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <BillingIntervalToggle
        interval={billingInterval}
        onIntervalChange={setBillingInterval}
        savingsPercent={savingsPercent}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            billingInterval={billingInterval}
            isPopular={tier.slug === "standard"}
          />
        ))}
      </div>
    </div>
  );
}
