"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCents } from "@/lib/subscriptions/types";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface PaymentRow {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  payment_method_summary: string | null;
  external_payment_id: string | null;
  failure_reason: string | null;
  created_at: string;
}

interface BillingHistoryProps {
  leagueId: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * BillingHistory — League owner billing table, paginated.
 * PRD 76: Subscription Management & Grandfathering
 */
export function BillingHistory({ leagueId }: BillingHistoryProps) {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 10;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/subscriptions/billing-history?league_id=${leagueId}&page=${page}&per_page=${perPage}`
      );
      const data = await res.json();
      if (data.payments) {
        setPayments(data.payments);
        setTotal(data.total);
      }
    } catch {
      toast.error("Failed to load billing history");
    } finally {
      setLoading(false);
    }
  }, [leagueId, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.ceil(total / perPage);

  const handleExport = async () => {
    try {
      const res = await fetch(
        `/api/subscriptions/billing-history/export?league_id=${leagueId}`
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `billing-history-${leagueId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export billing history");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      case "refunded":
        return "text-amber-600 dark:text-amber-400";
      case "pending":
        return "text-muted-foreground";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Billing History</h3>
        <button
          onClick={handleExport}
          className="text-sm px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors"
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No billing history yet.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {payments.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-border bg-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${statusColor(p.status)}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                  <span className="font-mono text-foreground">
                    {formatCents(p.amount_cents, p.currency)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("en-GB")}
                </div>
                {p.payment_method_summary && (
                  <div className="text-sm text-muted-foreground">
                    {p.payment_method_summary}
                  </div>
                )}
                {p.failure_reason && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {p.failure_reason}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Payment Method</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatCents(p.amount_cents, p.currency)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${statusColor(p.status)}`}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.payment_method_summary || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                      {p.external_payment_id || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
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
