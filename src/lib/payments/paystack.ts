/**
 * Paystack Payment Provider Adapter
 * Implements the PaymentProvider interface for Paystack.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * Uses raw fetch (not the paystack-sdk package) per PRD 72 recommendation.
 * Env vars: PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, PAYSTACK_WEBHOOK_SECRET
 *
 * Paystack API docs: https://paystack.com/docs/api/
 */

import { createHmac } from "crypto";
import type { PaymentProvider } from "./provider";
import type {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  CreatePlanRequest,
  CreatePlanResponse,
  CancelSubscriptionRequest,
  PauseSubscriptionRequest,
  ResumeSubscriptionRequest,
  PaymentEventType,
  WebhookEvent,
  WebhookEventData,
} from "./types";

const PAYSTACK_API_BASE = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
  }
  return key;
}

function getWebhookSecret(): string {
  const key = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_WEBHOOK_SECRET or PAYSTACK_SECRET_KEY environment variable is not set");
  }
  return key;
}

export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack";

  async createCheckoutSession(
    request: CheckoutSessionRequest
  ): Promise<CheckoutSessionResponse> {
    const secretKey = getSecretKey();

    // Paystack Transaction Initialize API
    // https://paystack.com/docs/api/transaction/#initialize
    const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: request.customer_email,
        // Paystack expects amount in smallest currency unit (kobo for NGN, cents for ZAR/USD)
        amount: request.amount_cents,
        currency: request.currency,
        callback_url: request.success_url,
        metadata: {
          league_id: request.league_id,
          tier_id: request.tier_id,
          billing_interval: request.billing_interval,
          cancel_url: request.cancel_url,
          ...request.metadata,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Paystack transaction initialize failed: ${response.status} ${errorData?.message || response.statusText}`
      );
    }

    const result = await response.json();

    if (!result.status || !result.data) {
      throw new Error("Paystack returned an unexpected response format");
    }

    return {
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = getWebhookSecret();
    const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
    return hash === signature;
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const payload = JSON.parse(rawBody);
    const eventType = mapPaystackEvent(payload.event);
    const data = extractEventData(payload);

    return {
      type: eventType,
      event_id: payload.data?.reference || payload.data?.id?.toString() || crypto.randomUUID(),
      data,
      raw: payload,
    };
  }

  async createSubscriptionPlan(
    request: CreatePlanRequest
  ): Promise<CreatePlanResponse> {
    const secretKey = getSecretKey();

    // Paystack uses "monthly" / "annually" for interval
    const response = await fetch(`${PAYSTACK_API_BASE}/plan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: request.name,
        amount: request.amount_cents,
        interval: request.interval,
        currency: request.currency,
        description: request.description || "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Paystack create plan failed: ${response.status} ${errorData?.message || response.statusText}`
      );
    }

    const result = await response.json();
    return {
      plan_code: result.data.plan_code,
      name: result.data.name,
    };
  }

  async cancelSubscription(
    request: CancelSubscriptionRequest
  ): Promise<void> {
    const secretKey = getSecretKey();

    // Paystack: disable subscription
    const response = await fetch(`${PAYSTACK_API_BASE}/subscription/disable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: request.subscription_code,
        token: request.email_token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Paystack cancel subscription failed: ${response.status} ${errorData?.message || response.statusText}`
      );
    }
  }

  async pauseSubscription(
    _request: PauseSubscriptionRequest
  ): Promise<void> {
    // Paystack does not natively support pause/resume.
    // We handle pause at the application level by disabling the subscription
    // and tracking the paused state in our DB. When resumed, a new subscription is created.
    // For now, this is a no-op on the provider side — pause is app-level only.
  }

  async resumeSubscription(
    request: ResumeSubscriptionRequest
  ): Promise<void> {
    const secretKey = getSecretKey();

    // Paystack: enable subscription
    const response = await fetch(`${PAYSTACK_API_BASE}/subscription/enable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: request.subscription_code,
        token: request.email_token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Paystack resume subscription failed: ${response.status} ${errorData?.message || response.statusText}`
      );
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

function mapPaystackEvent(event: string): PaymentEventType {
  const mapping: Record<string, PaymentEventType> = {
    "charge.success": "charge.success",
    "charge.failed": "charge.failed",
    "subscription.create": "subscription.create",
    "subscription.not_renew": "subscription.not_renew",
    "subscription.disable": "subscription.disable",
    "invoice.update": "invoice.update",
    "refund.processed": "refund.success",
  };
  return mapping[event] || "unknown";
}

function extractEventData(payload: Record<string, unknown>): WebhookEventData {
  const data = (payload.data || {}) as Record<string, unknown>;
  const authorization = (data.authorization || {}) as Record<string, unknown>;
  const customer = (data.customer || {}) as Record<string, unknown>;
  const metadata = (data.metadata || {}) as Record<string, string>;
  const plan = (data.plan || {}) as Record<string, unknown>;

  // Build payment method summary from authorization
  let paymentMethodSummary: string | undefined;
  if (authorization.brand && authorization.last4) {
    paymentMethodSummary = `${authorization.brand} ending ${authorization.last4}`;
  }

  return {
    reference: data.reference as string | undefined,
    customer_email: (customer.email as string) || (data.email as string) || undefined,
    customer_id: customer.customer_code as string | undefined,
    subscription_id: data.subscription_code as string | undefined,
    amount_cents: typeof data.amount === "number" ? data.amount : undefined,
    currency: data.currency as string | undefined,
    payment_method_summary: paymentMethodSummary,
    metadata,
    failure_reason: data.gateway_response as string | undefined,
    plan_code: plan.plan_code as string | undefined,
  };
}
