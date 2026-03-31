import { NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createAdminClient } from "@/lib/supabase/server";
import { log } from "@/lib/server/logger";
import type { WebhookEvent } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/paystack
 * Handles Paystack webhook events.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * Security: Verifies HMAC SHA-512 signature before processing.
 * Idempotency: Checks external_payment_id before creating records.
 * Events: charge.success, subscription.create, subscription.not_renew, charge.failed
 *
 * Note: This route does NOT use withApiHandler because webhooks need
 * raw body access for signature verification. Auth is handled via HMAC.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";

    if (!signature) {
      log("warn", "webhook_missing_signature", { provider: "paystack" }, undefined, requestId);
      return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
    }

    // 2. Verify signature
    const provider = await getPaymentProvider();
    const isValid = provider.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      log("warn", "webhook_invalid_signature", { provider: "paystack" }, undefined, requestId);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    // 3. Parse event
    const event = provider.parseWebhookEvent(rawBody);

    log("info", "webhook_received", {
      provider: "paystack",
      event_type: event.type,
      event_id: event.event_id,
    }, undefined, requestId);

    // 4. Process event
    const adminClient = createAdminClient();
    await processWebhookEvent(event, adminClient, requestId);

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    log("error", "webhook_failed", { error: message }, undefined, requestId);

    // Return 200 even on error to prevent Paystack retries for bad logic
    // Only return 4xx for signature failures (above)
    return new Response(JSON.stringify({ received: true, error: message }), { status: 200 });
  }
}

// ============================================================================
// Event Processing
// ============================================================================

async function processWebhookEvent(
  event: WebhookEvent,
  adminClient: ReturnType<typeof createAdminClient>,
  requestId: string
): Promise<void> {
  switch (event.type) {
    case "charge.success":
      await handleChargeSuccess(event, adminClient, requestId);
      break;
    case "charge.failed":
      await handleChargeFailed(event, adminClient, requestId);
      break;
    case "subscription.create":
      await handleSubscriptionCreate(event, adminClient, requestId);
      break;
    case "subscription.not_renew":
    case "subscription.disable":
      await handleSubscriptionNotRenew(event, adminClient, requestId);
      break;
    default:
      log("info", "webhook_unhandled_event", {
        event_type: event.type,
        event_id: event.event_id,
      }, undefined, requestId);
  }
}

/**
 * charge.success: Payment completed.
 * - Check idempotency via external_payment_id
 * - Create payment_history record
 * - Activate or create league_subscription
 */
async function handleChargeSuccess(
  event: WebhookEvent,
  adminClient: ReturnType<typeof createAdminClient>,
  requestId: string
): Promise<void> {
  const { reference, metadata, amount_cents, currency, payment_method_summary, customer_id } = event.data;

  if (!reference) {
    log("warn", "webhook_missing_reference", { event_id: event.event_id }, undefined, requestId);
    return;
  }

  // Idempotency check
  const { data: existing } = await adminClient
    .from("payment_history")
    .select("id")
    .eq("external_payment_id", reference)
    .maybeSingle();

  if (existing) {
    log("info", "webhook_duplicate_event", { reference, event_id: event.event_id }, undefined, requestId);
    return;
  }

  const leagueId = metadata?.league_id;
  const tierId = metadata?.tier_id;
  const billingInterval = metadata?.billing_interval as "monthly" | "annual" | undefined;

  if (!leagueId || !tierId) {
    log("warn", "webhook_missing_metadata", {
      reference,
      has_league_id: !!leagueId,
      has_tier_id: !!tierId,
    }, undefined, requestId);
    return;
  }

  // Find or create league subscription
  const { data: existingSub } = await adminClient
    .from("league_subscriptions")
    .select("id")
    .eq("league_id", leagueId)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  let subscriptionId: string;

  if (existingSub) {
    // Update existing subscription
    const { error: updateError } = await adminClient
      .from("league_subscriptions")
      .update({
        status: "active",
        tier_id: tierId,
        billing_interval: billingInterval || "monthly",
        external_customer_id: customer_id || null,
        current_period_start: new Date().toISOString(),
        current_period_end: calculatePeriodEnd(billingInterval || "monthly"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSub.id);

    if (updateError) {
      log("error", "webhook_subscription_update_failed", { error: updateError.message }, undefined, requestId);
    }

    subscriptionId = existingSub.id;
  } else {
    // Create new subscription
    const { data: newSub, error: insertError } = await adminClient
      .from("league_subscriptions")
      .insert({
        league_id: leagueId,
        tier_id: tierId,
        status: "active",
        billing_interval: billingInterval || "monthly",
        external_customer_id: customer_id || null,
        current_period_start: new Date().toISOString(),
        current_period_end: calculatePeriodEnd(billingInterval || "monthly"),
        metadata: { provider: "paystack" },
      })
      .select("id")
      .single();

    if (insertError || !newSub) {
      log("error", "webhook_subscription_create_failed", { error: insertError?.message }, undefined, requestId);
      return;
    }

    subscriptionId = newSub.id;
  }

  // Create payment history record
  const { error: paymentError } = await adminClient
    .from("payment_history")
    .insert({
      league_subscription_id: subscriptionId,
      amount_cents: amount_cents || 0,
      currency: currency || "ZAR",
      status: "succeeded",
      external_payment_id: reference,
      payment_method_summary: payment_method_summary || null,
      metadata: event.raw,
    });

  if (paymentError) {
    log("error", "webhook_payment_record_failed", { error: paymentError.message }, undefined, requestId);
  }

  log("info", "webhook_charge_processed", {
    league_id: leagueId,
    tier_id: tierId,
    reference,
    amount_cents,
  }, undefined, requestId);
}

/**
 * charge.failed: Payment failed.
 * Record the failure in payment_history.
 */
async function handleChargeFailed(
  event: WebhookEvent,
  adminClient: ReturnType<typeof createAdminClient>,
  requestId: string
): Promise<void> {
  const { reference, metadata, amount_cents, currency, failure_reason } = event.data;
  const leagueId = metadata?.league_id;

  if (!reference) return;

  // Idempotency check
  const { data: existing } = await adminClient
    .from("payment_history")
    .select("id")
    .eq("external_payment_id", reference)
    .maybeSingle();

  if (existing) return;

  // Find subscription for this league
  let subscriptionId: string | null = null;
  if (leagueId) {
    const { data: sub } = await adminClient
      .from("league_subscriptions")
      .select("id")
      .eq("league_id", leagueId)
      .maybeSingle();
    subscriptionId = sub?.id || null;
  }

  if (subscriptionId) {
    await adminClient
      .from("payment_history")
      .insert({
        league_subscription_id: subscriptionId,
        amount_cents: amount_cents || 0,
        currency: currency || "ZAR",
        status: "failed",
        external_payment_id: reference,
        failure_reason: failure_reason || "Payment declined",
        metadata: event.raw,
      });
  }

  log("info", "webhook_charge_failed", {
    reference,
    league_id: leagueId,
    failure_reason,
  }, undefined, requestId);
}

/**
 * subscription.create: Subscription created on provider side.
 * Update league_subscription with external IDs.
 */
async function handleSubscriptionCreate(
  event: WebhookEvent,
  adminClient: ReturnType<typeof createAdminClient>,
  requestId: string
): Promise<void> {
  const { subscription_id, customer_id, metadata } = event.data;
  const leagueId = metadata?.league_id;

  if (!leagueId || !subscription_id) {
    log("warn", "webhook_subscription_create_missing_data", {
      has_league_id: !!leagueId,
      has_subscription_id: !!subscription_id,
    }, undefined, requestId);
    return;
  }

  const { error } = await adminClient
    .from("league_subscriptions")
    .update({
      external_subscription_id: subscription_id,
      external_customer_id: customer_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("league_id", leagueId)
    .in("status", ["active", "trialing"]);

  if (error) {
    log("error", "webhook_subscription_update_failed", { error: error.message }, undefined, requestId);
  }

  log("info", "webhook_subscription_created", {
    league_id: leagueId,
    subscription_id,
  }, undefined, requestId);
}

/**
 * subscription.not_renew / subscription.disable: Subscription won't renew.
 * Mark league_subscription as past_due.
 */
async function handleSubscriptionNotRenew(
  event: WebhookEvent,
  adminClient: ReturnType<typeof createAdminClient>,
  requestId: string
): Promise<void> {
  const { subscription_id, metadata } = event.data;
  const leagueId = metadata?.league_id;

  if (!leagueId && !subscription_id) return;

  // Find the subscription either by league_id or external_subscription_id
  let query = adminClient
    .from("league_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    });

  if (subscription_id) {
    query = query.eq("external_subscription_id", subscription_id);
  } else if (leagueId) {
    query = query.eq("league_id", leagueId).eq("status", "active");
  }

  const { error } = await query;

  if (error) {
    log("error", "webhook_subscription_not_renew_failed", { error: error.message }, undefined, requestId);
  }

  log("info", "webhook_subscription_not_renew", {
    league_id: leagueId,
    subscription_id,
  }, undefined, requestId);
}

// ============================================================================
// Helpers
// ============================================================================

function calculatePeriodEnd(interval: "monthly" | "annual"): string {
  const now = new Date();
  if (interval === "annual") {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString();
}
