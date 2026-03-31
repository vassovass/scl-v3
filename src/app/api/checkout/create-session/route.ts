import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { AppError, ErrorCode } from "@/lib/errors";
import { getPaymentProvider } from "@/lib/payments/provider";
import { badRequest, forbidden } from "@/lib/api";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  league_id: z.string().uuid(),
  tier_id: z.string().uuid(),
  billing_interval: z.enum(["monthly", "annual"]),
});

/**
 * POST /api/checkout/create-session
 * Creates a Paystack checkout session for league upgrade.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * Validates:
 * - User owns the league
 * - Tier exists and is active
 * - League doesn't already have an active subscription
 * - Pay gate is enabled
 */
export const POST = withApiHandler(
  {
    auth: "required",
    schema: checkoutSchema,
    rateLimit: { maxRequests: 5, windowMs: 60_000 },
  },
  async ({ user, body, adminClient, request }) => {
    const { league_id, tier_id, billing_interval } = body;

    // 1. Verify user owns the league
    const { data: membership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("user_id", user!.id)
      .eq("league_id", league_id)
      .single();

    if (!membership || membership.role !== "owner") {
      return forbidden("Only the league owner can upgrade the subscription");
    }

    // 2. Check pay gate is enabled
    const { data: payGateSetting } = await adminClient
      .from("app_settings")
      .select("value")
      .eq("key", "feature_pay_gate")
      .single();

    const payGateEnabled =
      payGateSetting?.value === true || payGateSetting?.value === "true";

    if (!payGateEnabled) {
      return badRequest("Pay gate is not currently enabled");
    }

    // 3. Verify tier exists and is active
    const { data: tier, error: tierError } = await adminClient
      .from("subscription_tiers")
      .select("*")
      .eq("id", tier_id)
      .eq("is_active", true)
      .single();

    if (tierError || !tier) {
      return badRequest("Selected tier is not available");
    }

    // Don't allow checkout for free or contact-us tiers
    if (tier.monthly_price_cents === 0 && tier.member_limit === null) {
      return badRequest("Cannot checkout for enterprise tier — please contact us");
    }
    if (tier.monthly_price_cents === 0) {
      return badRequest("Cannot checkout for the free tier");
    }

    // 4. Check league doesn't already have an active subscription
    const { data: existingSub } = await adminClient
      .from("league_subscriptions")
      .select("id, status")
      .eq("league_id", league_id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (existingSub) {
      return badRequest("This league already has an active subscription");
    }

    // 5. Get user email
    const { data: userData } = await adminClient
      .from("users")
      .select("email")
      .eq("id", user!.id)
      .single();

    if (!userData?.email) {
      throw new AppError({
        code: ErrorCode.API_REQUEST_FAILED,
        message: "Could not retrieve user email for checkout",
      });
    }

    // 6. Calculate amount
    const amountCents =
      billing_interval === "annual"
        ? tier.annual_price_cents
        : tier.monthly_price_cents;

    // 7. Build URLs
    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/league/${league_id}/overview?checkout=success&tier=${tier.slug}`;
    const cancelUrl = `${origin}/league/${league_id}/overview?checkout=cancelled`;

    // 8. Create checkout session via payment provider
    const provider = await getPaymentProvider();
    const session = await provider.createCheckoutSession({
      league_id,
      tier_id,
      billing_interval,
      amount_cents: amountCents,
      currency: "ZAR",
      customer_email: userData.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        league_id,
        tier_id,
        tier_slug: tier.slug,
        billing_interval,
        user_id: user!.id,
      },
    });

    return {
      authorization_url: session.authorization_url,
      reference: session.reference,
    };
  }
);
