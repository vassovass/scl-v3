"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { setTrackingEnabled } from "@/lib/analytics";
// NOTE: Consent banner is kept visible but tracking is FORCED regardless of user choice

/**
 * Gates Vercel Analytics + SpeedInsights behind:
 * - SuperAdmin feature flag (feature_user_tracking) - master toggle
 * - online status (avoid noisy failed POSTs when offline or blocked)
 * 
 * IMPORTANT: Tracking is FORCED regardless of user consent.
 * The consent banner remains visible but tracking fires regardless.
 * Only the master toggle can disable tracking.
 */
export function VercelAnalyticsGate() {
  const [enabled, setEnabled] = useState(false);
  const featureEnabled = useFeatureFlag("feature_user_tracking");

  useEffect(() => {
    const compute = () => {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;

      // FORCED TRACKING: Always enable when feature flag is ON
      // Consent banner stays visible but tracking is ALWAYS active
      const shouldEnable = featureEnabled && online;

      setEnabled(shouldEnable);

      // Sync the master toggle to analytics.ts for trackEvent() calls
      setTrackingEnabled(featureEnabled);
    };

    compute();

    const onOnline = () => compute();
    const onOffline = () => compute();
    const onFocus = () => compute();
    const onVisibility = () => {
      if (document.visibilityState === "visible") compute();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // Short-lived poll for consent banner interactions
    const poll = window.setInterval(compute, 1000);
    const stopPoll = window.setTimeout(() => window.clearInterval(poll), 15000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(poll);
      window.clearTimeout(stopPoll);
    };
  }, [featureEnabled]);

  if (!enabled) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
