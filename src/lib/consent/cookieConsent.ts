/**
 * CookieConsent helpers (vanilla-cookieconsent)
 *
 * We use these to gate third-party scripts until the user opts in,
 * which also reduces noisy console/network errors from blocked trackers.
 */

export type ConsentCategory = "necessary" | "analytics" | "marketing";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.slice(name.length + 1));
}

/**
 * vanilla-cookieconsent stores a JSON payload in the `cc_cookie` cookie.
 * We parse it defensively and extract enabled categories.
 */
export function getCookieConsentCategories(): ConsentCategory[] {
  const raw = getCookieValue("cc_cookie");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as any;
    const categories = parsed?.categories;
    if (Array.isArray(categories)) {
      return categories.filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsentCategories().includes("analytics");
}

