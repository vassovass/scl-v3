"use client";

import { useState, useEffect, useCallback } from "react";
import type { SubscriptionTier } from "@/lib/subscriptions/types";

/**
 * League subscription state hook.
 * Fetches from /api/leagues/[id]/subscription and provides capacity info.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * Returns subscription tier, status, member limits, and capacity calculations.
 * When no subscription row exists, the league is on the free tier.
 */

interface LeagueSubscriptionState {
  /** The tier the league is on (null if free/no subscription) */
  tier: Pick<SubscriptionTier, "id" | "slug" | "name" | "monthly_price_cents" | "annual_price_cents" | "member_limit" | "features" | "grace_period_days"> | null;
  /** Subscription status */
  status: "active" | "past_due" | "canceled" | "trialing" | "paused" | "free";
  /** Maximum members allowed */
  memberLimit: number;
  /** Current member count */
  currentMembers: number;
  /** Remaining capacity */
  capacityRemaining: number;
  /** Whether the league is at or over capacity */
  isAtCapacity: boolean;
  /** Per-league pay gate override (null = follow global) */
  payGateOverride: boolean | null;
  /** Billing interval */
  billingInterval: "monthly" | "annual" | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Refresh the subscription data */
  refresh: () => void;
}

export function useLeagueSubscription(leagueId: string | undefined): LeagueSubscriptionState {
  const [data, setData] = useState<{
    tier: LeagueSubscriptionState["tier"];
    status: LeagueSubscriptionState["status"];
    memberLimit: number;
    currentMembers: number;
    payGateOverride: boolean | null;
    billingInterval: "monthly" | "annual" | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!leagueId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/leagues/${leagueId}/subscription`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch subscription: ${response.status}`);
      }

      const result = await response.json();
      setData({
        tier: result.tier || null,
        status: result.status || "free",
        memberLimit: result.member_limit ?? 3,
        currentMembers: result.current_members ?? 0,
        payGateOverride: result.pay_gate_override ?? null,
        billingInterval: result.billing_interval || null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch subscription";
      setError(message);
      // Set defaults so UI doesn't break
      setData({
        tier: null,
        status: "free",
        memberLimit: 3,
        currentMembers: 0,
        payGateOverride: null,
        billingInterval: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const memberLimit = data?.memberLimit ?? 3;
  const currentMembers = data?.currentMembers ?? 0;
  const capacityRemaining = Math.max(0, memberLimit - currentMembers);

  return {
    tier: data?.tier ?? null,
    status: data?.status ?? "free",
    memberLimit,
    currentMembers,
    capacityRemaining,
    isAtCapacity: currentMembers >= memberLimit,
    payGateOverride: data?.payGateOverride ?? null,
    billingInterval: data?.billingInterval ?? null,
    isLoading,
    error,
    refresh: fetchSubscription,
  };
}
