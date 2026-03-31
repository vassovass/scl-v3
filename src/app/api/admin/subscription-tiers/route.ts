import { withApiHandler } from "@/lib/api/handler";
import { AppError, ErrorCode } from "@/lib/errors";
import { createTierSchema } from "@/lib/subscriptions/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/subscription-tiers
 * List all tiers including inactive ones, ordered by sort_order.
 * SuperAdmin only.
 */
export const GET = withApiHandler(
  { auth: "superadmin" },
  async ({ adminClient }) => {
    const { data, error } = await adminClient
      .from("subscription_tiers")
      .select("*")
      .order("sort_order");

    if (error) {
      throw new AppError({
        code: ErrorCode.DB_QUERY_FAILED,
        message: "Failed to fetch subscription tiers",
        context: { error: error.message },
      });
    }

    return { tiers: data || [] };
  }
);

/**
 * POST /api/admin/subscription-tiers
 * Create a new subscription tier.
 * SuperAdmin only.
 */
export const POST = withApiHandler(
  { auth: "superadmin", schema: createTierSchema },
  async ({ user, body, adminClient }) => {
    const { data, error } = await adminClient
      .from("subscription_tiers")
      .insert({
        ...body,
        updated_by: user!.id,
      })
      .select()
      .single();

    if (error) {
      throw new AppError({
        code: ErrorCode.DB_INSERT_FAILED,
        message: "Failed to create subscription tier",
        context: { error: error.message },
      });
    }

    return { tier: data };
  }
);
