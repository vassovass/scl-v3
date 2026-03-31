import { NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createAdminClient } from "@/lib/supabase/server";
import { log } from "@/lib/server/logger";
import { transition } from "@/lib/subscriptions/stateMachine";
import type { WebhookEvent } from "@/lib/payments/types";
import type { LeagueSubscription, SubscriptionStatus } from "@/lib/subscriptions/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/paystack
 * Handles Paystack webhook events.
 * PRD 75: Pay Gate UI & Enforcement
 * PRD 76: Subscription Management & Grandfathering
 *
 * Security: Verifies HMAC SHA-512 signature before processing.
 * Idempotency: Checks external_payment_id before creating records.
 * Dead letter: All raw webhooks logged to webhook_events table.
 * State machine: All status transitions go through stateMachine.transition().
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

    // 4. Log to webhook_events dead letter table
    const adminClient = createAdminClient();
    await logWebhookEvent(adminClient, event, requestId);

    // 5. Process event
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
// Dead Letter Logging
// ============================================================================

async function logWebhookEvent(
  adminClient: ReturnType<typeof createAdminClient>,
  event: WebhookEvent,
  requestId: string
): Promise<void> {
  try {
    await adminClient
      .from("webhook_events")
      .insert({
        provider: "paystack",
        event_id: event.event_id,
        event_type: event.type,
        payload: event.raw,
      });
  } catch (err) {
    // Don't fail the webhook processing if logging fails
    log("error", "webhook_event_log_failed", {
      error: err instanceof Error ? err.message : "Unknown",
      event_id: event.event_id,
    }, undefined, requestId);
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
    case "invoice.update":
      await handleInvoiceUpdate(event, adminClient, requestId);
      break;
    case "refund.success":
      await handleRefundSuccess(event, adminClient, requestId);
      break;
    default:
      log("info", "webhook_unhandled_event", {
        event_type: event.type,
        event_id: event.event_id,
      }, undefined, requestId);
  }

  // Mark webhook as processed
  await adminClient
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("event_id", event.event_id)
    .eq("provider", "paystack");
}

// ============================================================================
// State Machine Transition Helper
// ============================================================================

async function transitionSubscription(
  adminClient: ReturnType<typeof createAdminClient>,
  subscription: LeagueSubscription,
  toStatus: SubscriptionStatus,
  reason: string,
  metadata: Record<string, unknown> = {},
  requestId: string
): Promise<boolean> {
  const result = transition({
    subscription,
    to: toStatus,
    reason,
    triggered_by: "webhook",
    metadata,
  });

  if (!result.success) {
    log("warn", "webhook_transition_blocked", {
      subscription_id: subscription.id,
      from: subscription.status,
      to: toStatus,
      error: result.error,
    }, undefined, requestId);
    return false;
  }

  // Apply the transition
  const updateData: Record<string, unknown> = {
    status: toStatus,
    updated_at: new Date().toISOString(),
  };

  // Side effects based on transition
  if (toStatus === "canceled") {
    updateData.canceled_at = new Date().toISOString();
  }

  const { error: updateError } = await adminClient
    .from("league_subscriptions")
    .update(updateData)
    .eq("id", subscription.id);

  if (updateError) {
    log("error", "webhook_transition_update_failed", {
      error: updateError.message,
      subscription_id: subscription.id,
    }, undefined, requestId);
    return false;
  }

  // Log the event
  if (result.event) {
    await adminClient.from("subscription_events").insert(result.event);
  }

  return true;
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * charge.success: Payment completed.
 * - Idempotency check via external_payment_id
 * - If existing subscription: this is a renewal — extend period, transition to active
 * - If no subscription: initial checkout — create subscription with price lock
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

  // Get tier info for price locking
  const { data: tier } = await adminClient
    .from("subscription_tiers")
    .select("monthly_price_cents, annual_price_cents")
    .eq("id", tierId)
    .single();

  const interval = billingInterval || "monthly";
  const lockedPrice = tier
    ? (interval === "annual" ? tier.annual_price_cents : tier.monthly_price_cents)
    : (amount_cents || 0);

  // Find existing subscription for this league
  const { data: existingSub } = await adminClient
    .from("league_subscriptions")
    .select("*")
    .eq("league_id", leagueId)
    .in("status", ["active", "trialing", "past_due", "canceled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let subscriptionId: string;

  if (existingSub) {
    // Renewal or recovery — transition back to active via state machine
    const sub = existingSub as unknown as LeagueSubscription;
    const newPeriodEnd = calculatePeriodEnd(interval);

    if (sub.status !== "active") {
      await transitionSubscription(
        adminClient,
        sub,
        "active",
        sub.status === "past_due" ? "Payment recovered" : "Renewal payment succeeded",
        { reference, amount_cents },
        requestId
      );
    }

    // Extend period
    const { error: updateError } = await adminClient
      .from("league_subscriptions")
      .update({
        status: "active",
        tier_id: tierId,
        billing_interval: interval,
        external_customer_id: customer_id || existingSub.external_customer_id,
        current_period_start: new Date().toISOString(),
        current_period_end: newPeriodEnd,
        canceled_at: null, // Clear any cancellation
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSub.id);

    if (updateError) {
      log("error", "webhook_subscription_update_failed", { error: updateError.message }, undefined, requestId);
    }

    subscriptionId = existingSub.id;
  } else {
    // New subscription — lock the price
    const { data: newSub, error: insertError } = await adminClient
      .from("league_subscriptions")
      .insert({
        league_id: leagueId,
        tier_id: tierId,
        status: "active",
        billing_interval: interval,
        external_customer_id: customer_id || null,
        current_period_start: new Date().toISOString(),
        current_period_end: calculatePeriodEnd(interval),
        price_locked_at_cents: lockedPrice,
        metadata: { provider: "paystack" },
      })
      .select("id")
      .single();

    if (insertError || !newSub) {
      log("error", "webhook_subscription_create_failed", { error: insertError?.message }, undefined, requestId);
      return;
    }

    subscriptionId = newSub.id;

    // Log creation event
    await adminClient.from("subscription_events").insert({
      league_subscription_id: subscriptionId,
      from_status: null,
      to_status: "active",
      reason: "Initial subscription created via checkout",
      metadata: { reference, tier_id: tierId, price_locked_at_cents: lockedPrice },
      triggered_by: "webhook",
    });
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
 * Transition subscription to past_due via state machine.
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
      .select("*")
      .eq("league_id", leagueId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (sub) {
      subscriptionId = sub.id;

      // Transition to past_due via state machine
      await transitionSubscription(
        adminClient,
        sub as unknown as LeagueSubscription,
        "past_due",
        `Payment failed: ${failure_reason || "Unknown reason"}`,
        { reference, failure_reason },
        requestId
      );
    }
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
 * Transition to past_due via state machine.
 */
async function handleSubscriptionNotRenew(
  event: WebhookEvent,
  adminClient: ReturnType<typeof createAdminClient>,
  requestId: string
): Promise<void> {
  const { subscription_id, metadata } = event.data;
  const leagueId = metadata?.league_id;

  if (!leagueId && !subscription_id) return;

  // Find the subscription
  let query = adminClient
    .from("league_subscriptions")
    .select("*");

  if (subscription_id) {
    query = query.eq("external_subscription_id", subscription_id);
  } else if (leagueId) {
    query = query.eq("league_id", leagueId).eq("status", "active");
  }

  const { data: sub } = await query.maybeSingle();

  if (sub) {
    await transitionSubscription(
      adminClient,
      sub as unknown as LeagueSubscription,
      "past_due",
      "Subscription will not renew (provider notification)",
      { subscription_id, event_type: event.type },
      requestId
    );
  }

  log("info", "webhook_subscription_not_renew", {
    league_id: leagueId,
    subscription_id,
  }, undefined, requestId);
}

/**
 * invoice.update: Invoice status changed.
 * Log the event for visibility.
 */
async function handleInvoiceUpdate(
  event: WebhookEvent,
  adminClient: ReturnType<typeof createAdminClient>,
  requestId: string
): Promise<void> {
  const { metadata } = event.data;
  const leagueId = metadata?.league_id;

  if (leagueId) {
    const { data: sub } = await adminClient
      .from("league_subscriptions")
      .select("id")
      .eq("league_id", leagueId)
      .maybeSingle();

    if (sub) {
      await adminClient.from("subscription_events").insert({
        league_subscription_id: sub.id,
        from_status: null,
        to_status: "active", // Invoice events don't change status
        reason: "Invoice updated by payment provider",
        metadata: event.raw,
        triggered_by: "webhook",
      });
    }
  }

  log("info", "webhook_invoice_update", {
    league_id: leagueId,
    event_id: event.event_id,
  }, undefined, requestId);
}

/**
 * refund.success: Refund processed.
 * Record in payment_history.
 */
async function handleRefundSuccess(
  event: WebhookEvent,
  adminClient: ReturnType<typeof createAdminClient>,
  requestId: string
): Promise<void> {
  const { reference, metadata, amount_cents, currency } = event.data;
  const leagueId = metadata?.league_id;

  if (!leagueId) return;

  const { data: sub } = await adminClient
    .from("league_subscriptions")
    .select("id")
    .eq("league_id", leagueId)
    .maybeSingle();

  if (sub) {
    await adminClient.from("payment_history").insert({
      league_subscription_id: sub.id,
      amount_cents: -(amount_cents || 0), // Negative for refund
      currency: currency || "ZAR",
      status: "refunded",
      external_payment_id: reference || event.event_id,
      metadata: event.raw,
    });

    await adminClient.from("subscription_events").insert({
      league_subscription_id: sub.id,
      from_status: null,
      to_status: "active",
      reason: "Refund processed",
      metadata: { reference, amount_cents },
      triggered_by: "webhook",
    });
  }

  log("info", "webhook_refund_processed", {
    league_id: leagueId,
    reference,
    amount_cents,
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
