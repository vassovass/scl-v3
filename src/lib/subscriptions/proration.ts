/**
 * Pro-ration Calculator
 * Day-based fraction for mid-cycle tier upgrades and downgrades.
 * PRD 76: Subscription Management & Grandfathering
 *
 * Formula: (new_price - old_price) * (days_remaining / total_days)
 * All amounts in cents. Rounding in customer's favor:
 * - Charges: Math.floor (round down)
 * - Credits: Math.ceil (round up, i.e., give more credit)
 */

import { differenceInDays } from "date-fns";
import type { ProrationCalculation } from "./types";

/**
 * Calculate the pro-rated amount for a tier change mid-cycle.
 *
 * @param oldPriceCents - Current tier price in cents for the billing interval
 * @param newPriceCents - New tier price in cents for the billing interval
 * @param periodStart - Start of current billing period (ISO string)
 * @param periodEnd - End of current billing period (ISO string)
 * @param now - Current date (defaults to new Date(), injectable for testing)
 * @returns ProrationCalculation with the amount to charge/credit
 */
export function calculateProration(
  oldPriceCents: number,
  newPriceCents: number,
  periodStart: string,
  periodEnd: string,
  now: Date = new Date()
): ProrationCalculation {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const totalDays = Math.max(1, differenceInDays(end, start));
  const daysRemaining = Math.max(0, differenceInDays(end, now));

  const priceDiff = newPriceCents - oldPriceCents;
  const fraction = daysRemaining / totalDays;

  // Raw pro-rated amount (can be positive for upgrade, negative for downgrade)
  const rawAmount = priceDiff * fraction;

  // Round in customer's favor
  let amountCents: number;
  if (rawAmount >= 0) {
    // Charge: round down
    amountCents = Math.floor(rawAmount);
  } else {
    // Credit: round up (more negative = more credit to customer)
    amountCents = Math.ceil(rawAmount);
  }

  return {
    amount_cents: amountCents,
    days_remaining: daysRemaining,
    total_days: totalDays,
    old_price_cents: oldPriceCents,
    new_price_cents: newPriceCents,
  };
}

/**
 * Get the price in cents for a tier based on billing interval.
 */
export function getTierPrice(
  tier: { monthly_price_cents: number; annual_price_cents: number },
  interval: "monthly" | "annual"
): number {
  return interval === "annual" ? tier.annual_price_cents : tier.monthly_price_cents;
}

/**
 * Calculate the new period end when switching billing intervals.
 * Monthly -> Annual: new period starts now, ends in 1 year
 * Annual -> Monthly: continues until current annual period ends, then monthly kicks in
 */
export function calculateNewPeriodEnd(
  interval: "monthly" | "annual",
  from: Date = new Date()
): string {
  const end = new Date(from);
  if (interval === "annual") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end.toISOString();
}
