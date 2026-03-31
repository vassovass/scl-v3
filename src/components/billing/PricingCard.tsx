"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Check } from "lucide-react";
import { formatCents, isContactTier } from "@/lib/subscriptions/types";
import type { SubscriptionTier } from "@/lib/subscriptions/types";

/**
 * PricingCard — Renders a single subscription tier.
 * PRD 75: Pay Gate UI & Enforcement
 *
 * Supports monthly/annual display, contact-us tiers, and highlighted "popular" tier.
 */

interface PricingCardProps {
  tier: Pick<
    SubscriptionTier,
    | "id"
    | "slug"
    | "name"
    | "description"
    | "monthly_price_cents"
    | "annual_price_cents"
    | "member_limit"
    | "features"
  >;
  billingInterval: "monthly" | "annual";
  isPopular?: boolean;
  isCurrentTier?: boolean;
  onSelect?: (tierId: string) => void;
  isLoading?: boolean;
}

export function PricingCard({
  tier,
  billingInterval,
  isPopular = false,
  isCurrentTier = false,
  onSelect,
  isLoading = false,
}: PricingCardProps) {
  const isContact = isContactTier(tier);
  const isFree = tier.monthly_price_cents === 0 && tier.member_limit !== null;

  const priceCents =
    billingInterval === "annual"
      ? tier.annual_price_cents
      : tier.monthly_price_cents;

  const priceLabel = isContact
    ? "Contact Us"
    : isFree
    ? "Free"
    : formatCents(priceCents);

  const intervalLabel = isContact
    ? ""
    : isFree
    ? "forever"
    : billingInterval === "annual"
    ? "/year"
    : "/month";

  // Calculate annual savings
  const annualSavings =
    !isContact && !isFree && billingInterval === "annual"
      ? tier.monthly_price_cents * 12 - tier.annual_price_cents
      : 0;

  const memberLimitLabel = tier.member_limit === null ? "Unlimited" : tier.member_limit;

  // Extract feature list from features JSONB
  const featureEntries = Object.entries(tier.features || {}).filter(
    ([, enabled]) => enabled
  );

  return (
    <Card
      className={`relative flex flex-col ${
        isPopular
          ? "border-2 border-primary shadow-lg"
          : "border border-border"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
        {tier.description && (
          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-foreground">
            {priceLabel}
          </span>
          {intervalLabel && (
            <span className="text-sm text-muted-foreground">{intervalLabel}</span>
          )}
        </div>

        {annualSavings > 0 && (
          <p className="text-xs text-primary font-medium">
            Save {formatCents(annualSavings)} per year
          </p>
        )}

        {/* Member limit */}
        <p className="text-sm text-muted-foreground">
          Up to <span className="font-semibold text-foreground">{memberLimitLabel}</span> members per league
        </p>

        {/* Features */}
        {featureEntries.length > 0 && (
          <ul className="space-y-2 pt-2">
            {featureEntries.map(([feature]) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  {formatFeatureName(feature)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        {isCurrentTier ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : isContact ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open("mailto:support@stepleague.app", "_blank")}
          >
            Contact Us
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isPopular ? "default" : "outline"}
            disabled={isLoading || isFree}
            onClick={() => onSelect?.(tier.id)}
          >
            {isLoading ? "Loading..." : isFree ? "Free Plan" : "Upgrade"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/** Convert snake_case feature keys to readable labels */
function formatFeatureName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
