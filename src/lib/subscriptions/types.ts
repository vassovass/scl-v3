/**
 * Subscription & Billing Types
 * Shared interfaces, Zod schemas, and utilities for the freemium billing layer.
 * PRD 74: Pay Gate Schema & Config
 *
 * Design principles:
 * - Provider-agnostic: external_* columns work with Paystack, Paddle, or Stripe
 * - Prices stored as integers in smallest currency unit (cents for USD)
 * - No <Database> generics — all types are handwritten and untyped
 */

import { z } from "zod";

// ============================================================================
// Database row shapes (match migration exactly)
// ============================================================================

export interface SubscriptionTier {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  monthly_price_cents: number;
  annual_price_cents: number;
  member_limit: number | null; // null = unlimited (Enterprise)
  is_active: boolean;
  sort_order: number;
  features: Record<string, boolean>;
  grace_period_days: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Tier row enriched with the count of leagues currently on it */
export interface SubscriptionTierWithCount extends SubscriptionTier {
  active_league_count: number;
}

export interface LeagueSubscription {
  id: string;
  league_id: string;
  tier_id: string;
  status: "active" | "past_due" | "canceled" | "trialing" | "paused";
  billing_interval: "monthly" | "annual";
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  external_subscription_id: string | null; // Paystack: SUB_xxx | Paddle: sub_xxx
  external_customer_id: string | null;     // Paystack: CUS_xxx | Paddle: ctm_xxx
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryEntry {
  id: string;
  league_subscription_id: string;
  amount_cents: number;
  currency: string;
  status: "succeeded" | "failed" | "refunded" | "pending";
  external_payment_id: string | null;   // Paystack transaction ref
  external_invoice_id: string | null;   // Paystack/Paddle invoice
  payment_method_summary: string | null; // e.g. "Visa ending 4242"
  failure_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// Zod validation schemas (used by API routes)
// ============================================================================

export const createTierSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  monthly_price_cents: z.number().int().min(0, "Price cannot be negative"),
  annual_price_cents: z.number().int().min(0, "Price cannot be negative"),
  member_limit: z.number().int().min(1).nullable().optional(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).optional().default(0),
  features: z.record(z.boolean()).optional().default({}),
  grace_period_days: z.number().int().min(0).max(90).optional().default(7),
});

export const updateTierSchema = createTierSchema.partial();

export type CreateTierInput = z.infer<typeof createTierSchema>;
export type UpdateTierInput = z.infer<typeof updateTierSchema>;

// ============================================================================
// Display utilities
// ============================================================================

/**
 * Convert cents to a display string.
 * formatCents(499) → "$4.99"
 * formatCents(0) → "$0.00"
 */
export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Convert a dollar string to cents integer.
 * dollarsToCents("4.99") → 499
 * dollarsToCents("49") → 4900
 */
export function dollarsToCents(dollars: string | number): number {
  const value = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (isNaN(value)) return 0;
  return Math.round(value * 100);
}

/**
 * Convert cents to a decimal dollar string for form inputs.
 * centsToDollars(499) → "4.99"
 * centsToDollars(4900) → "49.00"
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Returns true if a tier is "contact us" style (Enterprise).
 * Enterprise: member_limit is null AND both prices are 0
 */
export function isContactTier(tier: Pick<SubscriptionTier, "monthly_price_cents" | "member_limit">): boolean {
  return tier.member_limit === null && tier.monthly_price_cents === 0;
}
