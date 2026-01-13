"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { hasAnalyticsConsent } from "@/lib/consent/cookieConsent";

/**
 * Gates Vercel Analytics + SpeedInsights behind:
 * - user analytics consent (cookie consent banner)
 * - online status (avoid noisy failed POSTs when offline or blocked)
 */
export function VercelAnalyticsGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const compute = () => {
      const consented = hasAnalyticsConsent();
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      setEnabled(consented && online);
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
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

