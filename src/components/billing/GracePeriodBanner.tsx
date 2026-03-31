"use client";

/**
 * GracePeriodBanner — Warning banner for past_due subscriptions.
 * Shows during grace period with a link to update payment method.
 * PRD 76: Subscription Management & Grandfathering
 */

interface GracePeriodBannerProps {
  periodEnd: string | null;
  gracePeriodDays?: number;
  updatePaymentUrl?: string;
}

export function GracePeriodBanner({
  periodEnd,
  gracePeriodDays = 7,
  updatePaymentUrl = "#",
}: GracePeriodBannerProps) {
  if (!periodEnd) return null;

  const end = new Date(periodEnd);
  const graceEnd = new Date(end);
  graceEnd.setDate(graceEnd.getDate() + gracePeriodDays);

  const now = new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const isUrgent = daysLeft <= 2;

  return (
    <div
      className={`w-full rounded-lg border px-4 py-3 ${
        isUrgent
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isUrgent ? "Urgent: " : ""}Payment failed
          </p>
          <p className="text-xs opacity-80">
            {daysLeft > 0
              ? `Update your payment method within ${daysLeft} day${daysLeft !== 1 ? "s" : ""} to keep your subscription active.`
              : "Your grace period has expired. Update your payment method to restore access."}
          </p>
        </div>
        <a
          href={updatePaymentUrl}
          className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            isUrgent
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
          }`}
        >
          Update payment method
        </a>
      </div>
    </div>
  );
}
