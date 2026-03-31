/**
 * Payment Provider Interface
 * Provider-agnostic contract that all payment adapters implement.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * To switch providers (e.g., Paystack -> Paddle), implement a new adapter
 * and update getPaymentProvider() below. No other code changes needed.
 */

import type {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  CreatePlanRequest,
  CreatePlanResponse,
  CancelSubscriptionRequest,
  PauseSubscriptionRequest,
  ResumeSubscriptionRequest,
  WebhookEvent,
} from "./types";

export interface PaymentProvider {
  /** Provider name for logging and metadata */
  readonly name: string;

  /**
   * Create a checkout session and return the redirect URL.
   * The user will be redirected to the provider's hosted checkout page.
   */
  createCheckoutSession(
    request: CheckoutSessionRequest
  ): Promise<CheckoutSessionResponse>;

  /**
   * Verify the webhook signature from the raw request body and signature header.
   * Returns true if the signature is valid, false otherwise.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;

  /**
   * Parse a raw webhook payload into a normalized WebhookEvent.
   */
  parseWebhookEvent(rawBody: string): WebhookEvent;

  /**
   * Create a subscription plan/product on the provider.
   * PRD 76: Subscription Management
   */
  createSubscriptionPlan(
    request: CreatePlanRequest
  ): Promise<CreatePlanResponse>;

  /**
   * Cancel a subscription on the provider.
   * PRD 76: Subscription Management
   */
  cancelSubscription(
    request: CancelSubscriptionRequest
  ): Promise<void>;

  /**
   * Pause a subscription on the provider (if supported).
   * PRD 76: Subscription Management
   */
  pauseSubscription(
    request: PauseSubscriptionRequest
  ): Promise<void>;

  /**
   * Resume a paused subscription on the provider (if supported).
   * PRD 76: Subscription Management
   */
  resumeSubscription(
    request: ResumeSubscriptionRequest
  ): Promise<void>;
}

// ============================================================================
// Provider Registry
// ============================================================================

let _provider: PaymentProvider | null = null;

/**
 * Get the active payment provider instance.
 * Lazily initialized on first call. Uses Paystack by default.
 */
export async function getPaymentProvider(): Promise<PaymentProvider> {
  if (!_provider) {
    const { PaystackProvider } = await import("./paystack");
    _provider = new PaystackProvider();
  }
  return _provider;
}
