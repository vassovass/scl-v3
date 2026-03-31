import { withApiHandler } from "@/lib/api/handler";
import { AppError, ErrorCode } from "@/lib/errors";
import { updateTierSchema } from "@/lib/subscriptions/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/subscription-tiers/[id]
 * Fetch a single tier with the count of leagues actively using it.
 * SuperAdmin only.
 */
export const GET = withApiHandler(
  { auth: "superadmin" },
  async ({ adminClient, params }) => {
    const { id } = params;

    const { data: tier, error } = await adminClient
      .from("subscription_tiers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !tier) {
      throw new AppError({
        code: ErrorCode.API_NOT_FOUND,
        message: "Subscription tier not found",
        context: { id },
      });
    }

    // Count leagues actively on this tier (active, trialing, or past_due)
    const { count, error: countError } = await adminClient
      .from("league_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("tier_id", id)
      .in("status", ["active", "trialing", "past_due"]);

    if (countError) {
      throw new AppError({
        code: ErrorCode.DB_QUERY_FAILED,
        message: "Failed to count active leagues for tier",
        context: { error: countError.message },
      });
    }

    return { tier: { ...tier, active_league_count: count ?? 0 } };
  }
);

/**
 * PATCH /api/admin/subscription-tiers/[id]
 * Update a subscription tier. Uses partial schema so any subset of fields can be updated.
 * SuperAdmin only.
 */
export const PATCH = withApiHandler(
  { auth: "superadmin", schema: updateTierSchema },
  async ({ user, body, adminClient, params }) => {
    const { id } = params;

    const { data, error } = await adminClient
      .from("subscription_tiers")
      .update({
        ...body,
        updated_by: user!.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AppError({
        code: ErrorCode.DB_UPDATE_FAILED,
        message: "Failed to update subscription tier",
        context: { error: error.message, id },
      });
    }

    if (!data) {
      throw new AppError({
        code: ErrorCode.API_NOT_FOUND,
        message: "Subscription tier not found",
        context: { id },
      });
    }

    return { tier: data };
  }
);
