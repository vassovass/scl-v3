import { withApiHandler } from "@/lib/api/handler";
import { AppError, ErrorCode } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/subscription-tiers
 * Public endpoint returning active tiers ordered by sort_order.
 * Used by the pricing page and any unauthenticated visitor.
 * Returns a limited set of columns — no internal fields (updated_by, etc.).
 */
export const GET = withApiHandler(
  { auth: "none" },
  async ({ adminClient }) => {
    const { data, error } = await adminClient
      .from("subscription_tiers")
      .select(
        "id, slug, name, description, monthly_price_cents, annual_price_cents, member_limit, features, sort_order, grace_period_days"
      )
      .eq("is_active", true)
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
