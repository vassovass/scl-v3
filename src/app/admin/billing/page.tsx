"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCents } from "@/lib/subscriptions/types";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface BillingMetrics {
  mrr: number;
  mrr_at_current_prices: number;
  total_active_subscriptions: number;
  churn_rate_30d: number;
  churned_30d: number;
  grandfathering: {
    count: number;
    monthly_revenue_loss_cents: number;
  };
  status_breakdown: Record<string, number>;
  tier_breakdown: Record<string, number>;
  total_revenue_cents: number;
}

interface SubscriptionRow {
  id: string;
  league_id: string;
  tier_id: string;
  status: string;
  billing_interval: string;
  price_locked_at_cents: number | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  subscription_tiers: {
    slug: string;
    name: string;
    monthly_price_cents: number;
    annual_price_cents: number;
  } | null;
  leagues: {
    id: string;
    name: string;
  } | null;
}

// ============================================================================
// Page
// ============================================================================

/**
 * SuperAdmin Billing Dashboard
 * Filterable subscription table, MRR widget, grandfathering summary, CSV export.
 * PRD 76: Subscription Management & Grandfathering
 */
export default function AdminBillingPage() {
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: "", tier: "", grandfathered: "" });
  const [loading, setLoading] = useState(true);
  const perPage = 25;

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/billing/metrics");
      const data = await res.json();
      if (!data.error) setMetrics(data);
    } catch {
      toast.error("Failed to load billing metrics");
    }
  }, []);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (filters.status) params.set("status", filters.status);
      if (filters.tier) params.set("tier", filters.tier);
      if (filters.grandfathered) params.set("grandfathered", filters.grandfathered);

      const res = await fetch(`/api/admin/billing?${params}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const totalPages = Math.ceil(total / perPage);

  const handleExportAll = async () => {
    try {
      // Build CSV from all subscriptions data
      const params = new URLSearchParams({ per_page: "10000" });
      if (filters.status) params.set("status", filters.status);
      const res = await fetch(`/api/admin/billing?${params}`);
      const data = await res.json();
      const rows = data.subscriptions || [];

      const header = "League,Tier,Status,Billing Interval,Locked Price,Current Price,Created,Period End\n";
      const csv = rows.map((s: SubscriptionRow) => {
        const tier = s.subscription_tiers;
        const currentPrice = tier
          ? (s.billing_interval === "annual" ? tier.annual_price_cents : tier.monthly_price_cents)
          : 0;
        return [
          `"${s.leagues?.name || s.league_id}"`,
          tier?.name || "",
          s.status,
          s.billing_interval,
          s.price_locked_at_cents != null ? formatCents(s.price_locked_at_cents) : "",
          formatCents(currentPrice),
          new Date(s.created_at).toISOString().split("T")[0],
          s.current_period_end ? new Date(s.current_period_end).toISOString().split("T")[0] : "",
        ].join(",");
      }).join("\n");

      const blob = new Blob([header + csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "subscriptions-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Billing Dashboard</h1>
        <button
          onClick={handleExportAll}
          className="px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-foreground text-sm transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Metrics cards */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4 lg:grid-cols-5">
          <MetricCard
            label="MRR"
            value={formatCents(metrics.mrr)}
            subtext={metrics.mrr !== metrics.mrr_at_current_prices ? `${formatCents(metrics.mrr_at_current_prices)} at current prices` : undefined}
          />
          <MetricCard
            label="Active Subs"
            value={String(metrics.total_active_subscriptions)}
          />
          <MetricCard
            label="30d Churn"
            value={`${metrics.churn_rate_30d}%`}
            subtext={`${metrics.churned_30d} canceled`}
          />
          <MetricCard
            label="Grandfathered"
            value={String(metrics.grandfathering.count)}
            subtext={metrics.grandfathering.monthly_revenue_loss_cents > 0
              ? `${formatCents(metrics.grandfathering.monthly_revenue_loss_cents)}/mo impact`
              : undefined}
          />
          <MetricCard
            label="Total Revenue"
            value={formatCents(metrics.total_revenue_cents)}
            subtext="All time"
          />
        </div>
      )}

      {/* Status and tier breakdown */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
          {/* Status breakdown */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Status Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(metrics.status_breakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-foreground capitalize">{status.replace("_", " ")}</span>
                  <span className="font-mono text-muted-foreground">{count}</span>
                </div>
              ))}
              {Object.keys(metrics.status_breakdown).length === 0 && (
                <div className="text-sm text-muted-foreground">No active subscriptions</div>
              )}
            </div>
          </div>

          {/* Tier breakdown */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Tier Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(metrics.tier_breakdown).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{tier}</span>
                  <span className="font-mono text-muted-foreground">{count}</span>
                </div>
              ))}
              {Object.keys(metrics.tier_breakdown).length === 0 && (
                <div className="text-sm text-muted-foreground">No subscriptions</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filters.status}
          onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past Due</option>
          <option value="paused">Paused</option>
          <option value="canceled">Canceled</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={filters.tier}
          onChange={(e) => { setFilters(f => ({ ...f, tier: e.target.value })); setPage(1); }}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">All tiers</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <select
          value={filters.grandfathered}
          onChange={(e) => { setFilters(f => ({ ...f, grandfathered: e.target.value })); setPage(1); }}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">All pricing</option>
          <option value="true">Grandfathered only</option>
        </select>
      </div>

      {/* Subscriptions table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No subscriptions found.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {subscriptions.map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm">
                    {s.leagues?.name || s.league_id.slice(0, 8)}
                  </span>
                  <StatusPill status={s.status} />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Tier: {s.subscription_tiers?.name || "Unknown"}</div>
                  <div>Interval: {s.billing_interval}</div>
                  {s.price_locked_at_cents != null && (
                    <div>Locked price: {formatCents(s.price_locked_at_cents)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">League</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tier</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Interval</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Locked Price</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Current Price</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Period End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((s) => {
                  const tier = s.subscription_tiers;
                  const currentPrice = tier
                    ? (s.billing_interval === "annual" ? tier.annual_price_cents : tier.monthly_price_cents)
                    : 0;
                  const isGrandfathered = s.price_locked_at_cents != null && s.price_locked_at_cents < currentPrice;

                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-foreground">
                        {s.leagues?.name || s.league_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {tier?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {s.billing_interval}
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {s.price_locked_at_cents != null ? (
                          <span className={isGrandfathered ? "text-green-600 dark:text-green-400" : ""}>
                            {formatCents(s.price_locked_at_cents)}
                            {isGrandfathered && " *"}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {formatCents(currentPrice)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.current_period_end
                          ? new Date(s.current_period_end).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="text-xs text-muted-foreground mt-2">
            * Grandfathered — paying below current tier price
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function MetricCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold text-foreground">{value}</div>
      {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    trialing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    past_due: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    paused: "bg-muted text-muted-foreground",
    canceled: "bg-red-500/10 text-red-700 dark:text-red-400",
    expired: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        colorMap[status] || "bg-muted text-muted-foreground"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
