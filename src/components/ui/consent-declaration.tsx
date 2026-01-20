"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics";

/**
 * Consent types that can be extended for future features
 */
export type ConsentType =
    | "proxy_submission"
    | "data_export"
    | "third_party_sharing";

/**
 * Configuration for each consent type
 */
const CONSENT_CONFIG: Record<ConsentType, {
    title: string;
    description: string;
    analyticsAction: string;
}> = {
    proxy_submission: {
        title: "Authorization Declaration",
        description: "I confirm that I have been authorized by this person to submit step data on their behalf. I understand this data will be attributed to them when they claim their profile.",
        analyticsAction: "proxy_consent_given",
    },
    data_export: {
        title: "Data Export Consent",
        description: "I understand that my data will be exported and I consent to this action.",
        analyticsAction: "data_export_consent",
    },
    third_party_sharing: {
        title: "Third Party Sharing",
        description: "I consent to sharing my data with the specified third party.",
        analyticsAction: "third_party_consent",
    },
};

interface ConsentDeclarationProps {
    consentType: ConsentType;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    proxyId?: string;
    leagueId?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * ConsentDeclaration - A reusable consent/declaration component
 * 
 * Used for legal acknowledgments when acting on behalf of others.
 * Logs consent to analytics for audit trail.
 * 
 * @example
 * <ConsentDeclaration
 *   consentType="proxy_submission"
 *   checked={hasConsent}
 *   onCheckedChange={(checked) => {
 *     setHasConsent(checked);
 *   }}
 *   proxyId={selectedProxy?.id}
 *   leagueId={selectedLeagueId}
 * />
 */
export function ConsentDeclaration({
    consentType,
    checked,
    onCheckedChange,
    proxyId,
    leagueId,
    disabled = false,
    className = "",
}: ConsentDeclarationProps) {
    const config = CONSENT_CONFIG[consentType];
    const checkboxId = `consent-${consentType}`;

    const handleChange = (newChecked: boolean) => {
        onCheckedChange(newChecked);

        // Log consent to analytics for audit trail
        if (newChecked) {
            trackEvent(config.analyticsAction, {
                category: "consent",
                action: "granted",
                consent_type: consentType,
                proxy_id: proxyId,
                league_id: leagueId,
            });
        }
    };

    return (
        <div className={`rounded-lg border border-[hsl(var(--warning)/.3)] bg-[hsl(var(--warning)/.1)] p-4 ${className}`}>
            <div className="flex items-start gap-3">
                <Checkbox
                    id={checkboxId}
                    checked={checked}
                    onCheckedChange={handleChange}
                    disabled={disabled}
                    className="mt-1 border-[hsl(var(--warning))] data-[state=checked]:bg-[hsl(var(--warning))] data-[state=checked]:border-[hsl(var(--warning))]"
                />
                <div className="flex-1">
                    <Label
                        htmlFor={checkboxId}
                        className="text-sm font-medium text-[hsl(var(--warning))] cursor-pointer"
                    >
                        {config.title}
                    </Label>
                    <p className="mt-1 text-xs text-[hsl(var(--warning))]/70 leading-relaxed">
                        {config.description}
                    </p>
                </div>
            </div>
        </div>
    );
}

