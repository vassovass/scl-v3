/**
 * Payment Provider Types
 * Provider-agnostic interfaces for checkout, webhooks, and payment events.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * Design: These types decouple the app from any specific payment provider.
 * Only the provider adapter (e.g., paystack.ts) knows about provider-specific formats.
 */

// ============================================================================
// Checkout
// ============================================================================

export interface CheckoutSessionRequest {
  /** League being upgraded */
  league_id: string;
  /** Tier being purchased */
  tier_id: string;
  /** Monthly or annual billing */
  billing_interval: "monthly" | "annual";
  /** Amount in cents */
  amount_cents: number;
  /** Currency code (e.g., "USD") */
  currency: string;
  /** Customer email for the payment provider */
  customer_email: string;
  /** URL to redirect on success */
  success_url: string;
  /** URL to redirect on cancellation */
  cancel_url: string;
  /** Arbitrary metadata passed to the provider */
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResponse {
  /** Provider's authorization/checkout URL — redirect user here */
  authorization_url: string;
  /** Provider's reference for this transaction */
  access_code: string;
  /** Provider's unique reference */
  reference: string;
}

// ============================================================================
// Webhook Events
// ============================================================================

export type PaymentEventType =
  | "charge.success"
  | "subscription.create"
  | "subscription.not_renew"
  | "subscription.disable"
  | "subscription.renewed"
  | "invoice.update"
  | "charge.failed"
  | "refund.success"
  | "unknown";

// ============================================================================
// Subscription Plan Management (PRD 76)
// ============================================================================

export interface CreatePlanRequest {
  /** Unique plan name */
  name: string;
  /** Amount in smallest currency unit */
  amount_cents: number;
  /** Billing interval */
  interval: "monthly" | "annually";
  /** Currency code */
  currency: string;
  /** Plan description */
  description?: string;
}

export interface CreatePlanResponse {
  /** Provider's plan/product ID */
  plan_code: string;
  /** Provider's plan name */
  name: string;
}

export interface CancelSubscriptionRequest {
  /** Provider subscription code */
  subscription_code: string;
  /** Provider email token (Paystack requires this) */
  email_token: string;
}

export interface PauseSubscriptionRequest {
  /** Provider subscription code */
  subscription_code: string;
  /** Provider email token */
  email_token: string;
}

export interface ResumeSubscriptionRequest {
  /** Provider subscription code */
  subscription_code: string;
  /** Provider email token */
  email_token: string;
}

export interface WebhookEvent {
  /** The event type */
  type: PaymentEventType;
  /** Provider's unique event ID (used for idempotency) */
  event_id: string;
  /** Parsed event data */
  data: WebhookEventData;
  /** Raw payload for storage */
  raw: Record<string, unknown>;
}

export interface WebhookEventData {
  /** Provider transaction/subscription reference */
  reference?: string;
  /** Customer email */
  customer_email?: string;
  /** Customer provider ID */
  customer_id?: string;
  /** Subscription provider ID */
  subscription_id?: string;
  /** Amount in smallest currency unit */
  amount_cents?: number;
  /** Currency code */
  currency?: string;
  /** Payment method summary (e.g., "Visa ending 4242") */
  payment_method_summary?: string;
  /** Metadata passed during checkout */
  metadata?: Record<string, string>;
  /** Failure reason if applicable */
  failure_reason?: string;
  /** Subscription plan code */
  plan_code?: string;
}
