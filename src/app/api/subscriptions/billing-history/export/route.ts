import { withApiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api";
import { formatCents } from "@/lib/subscriptions/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions/billing-history/export?league_id=xxx
 * CSV export of billing history for a league owner.
 * PRD 76: Subscription Management & Grandfathering
 */
export const GET = withApiHandler(
  {
    auth: "required",
    rateLimit: { maxRequests: 5, windowMs: 60_000 },
  },
  async ({ user, adminClient, request }) => {
    const url = new URL(request.url);
    const leagueId = url.searchParams.get("league_id");

    if (!leagueId) {
      return badRequest("league_id query parameter is required");
    }

    // Verify ownership
    const { data: membership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("user_id", user!.id)
      .eq("league_id", leagueId)
      .single();

    if (!membership || membership.role !== "owner") {
      return badRequest("Only the league owner can export billing history");
    }

    // Get all payments for this league
    const { data: subs } = await adminClient
      .from("league_subscriptions")
      .select("id")
      .eq("league_id", leagueId);

    if (!subs || subs.length === 0) {
      return new Response("Date,Amount,Currency,Status,Payment Method,Reference\n", {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="billing-history-${leagueId}.csv"`,
        },
      });
    }

    const subIds = subs.map((s: { id: string }) => s.id);

    const { data: payments } = await adminClient
      .from("payment_history")
      .select("*")
      .in("league_subscription_id", subIds)
      .order("created_at", { ascending: false });

    // Build CSV
    const header = "Date,Amount,Currency,Status,Payment Method,Reference,Failure Reason\n";
    const rows = (payments || [])
      .map((p: Record<string, unknown>) => {
        const date = new Date(p.created_at as string).toISOString().split("T")[0];
        const amount = formatCents(p.amount_cents as number, p.currency as string);
        return `${date},${amount},${p.currency},${p.status},"${p.payment_method_summary || ""}",${p.external_payment_id || ""},"${p.failure_reason || ""}"`;
      })
      .join("\n");

    return new Response(header + rows, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="billing-history-${leagueId}.csv"`,
      },
    });
  }
);
