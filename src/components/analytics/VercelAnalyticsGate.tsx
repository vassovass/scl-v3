"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { hasAnalyticsConsent } from "@/lib/consent/cookieConsent";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { setTrackingEnabled } from "@/lib/analytics";

/**
 * Gates Vercel Analytics + SpeedInsights behind:
 * - SuperAdmin feature flag (feature_user_tracking) - master toggle
 * - user analytics consent (cookie consent banner)
 * - online status (avoid noisy failed POSTs when offline or blocked)
 * 
 * The feature flag acts as a master switch:
 * - When OFF: no tracking regardless of consent
 * - When ON: consent-based tracking is in effect
 */
export function VercelAnalyticsGate() {
  const [enabled, setEnabled] = useState(false);
  const featureEnabled = useFeatureFlag("feature_user_tracking");

  useEffect(() => {
    const compute = () => {
      const consented = hasAnalyticsConsent();
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;

      // Master toggle: feature flag must be ON for any tracking
      // When feature is ON, consent determines if tracking happens
      const shouldEnable = featureEnabled && consented && online;

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
