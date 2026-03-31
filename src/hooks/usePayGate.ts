"use client";

import { useFeatureFlagWithLoading } from "./useFeatureFlag";
import { useAppSettings } from "./useAppSettings";

/**
 * Pay gate decision hook.
 * Combines feature flag, global setting, and per-league override into a single boolean.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * Cascade logic:
 * 1. `feature_pay_gate` feature flag must be true
 * 2. `pay_gate_global` app setting must be true
 * 3. Per-league `pay_gate_override` can force-free (false always wins)
 *
 * @param leaguePayGateOverride - Per-league override from league_subscriptions.
 *   null = follow global, true = force gate, false = force free.
 */
export function usePayGate(leaguePayGateOverride?: boolean | null) {
  const { enabled: featureFlagEnabled, isLoading: flagLoading } =
    useFeatureFlagWithLoading("feature_pay_gate");
  const { getSetting, getNumericSetting, isLoading: settingsLoading } =
    useAppSettings();

  const isLoading = flagLoading || settingsLoading;
  const freeTierLimit = getNumericSetting("free_tier_member_limit", 3);
  const globalEnabled = getSetting<boolean>("pay_gate_global", false);

  // Determine if pay gate is active
  let isPayGateActive = false;
  let reason = "loading";

  if (!isLoading) {
    if (!featureFlagEnabled) {
      isPayGateActive = false;
      reason = "feature_flag_disabled";
    } else if (leaguePayGateOverride === false) {
      // Per-league force-free always wins
      isPayGateActive = false;
      reason = "league_override_free";
    } else if (leaguePayGateOverride === true) {
      // Per-league force-gate
      isPayGateActive = true;
      reason = "league_override_gated";
    } else if (globalEnabled) {
      // Follow global setting
      isPayGateActive = true;
      reason = "global_enabled";
    } else {
      isPayGateActive = false;
      reason = "global_disabled";
    }
  }

  return {
    isPayGateActive,
    freeTierLimit,
    reason,
    isLoading,
  };
}
