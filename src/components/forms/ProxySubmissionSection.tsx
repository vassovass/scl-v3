"use client";

import React, { useState } from "react";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { BatchSubmissionForm } from "@/components/forms/BatchSubmissionForm";
import { BulkUnverifiedForm } from "@/components/forms/BulkUnverifiedForm";
import { ProxyMembersDropdown } from "@/components/league/ProxyMembersDropdown";
import { ConsentDeclaration } from "@/components/ui/consent-declaration";

interface League {
    id: string;
    name: string;
    role?: string;
}

interface ProxyMember {
    id: string;
    display_name: string;
    submission_count: number;
}

interface ProxySubmissionSectionProps {
    /** Leagues where user is admin/owner */
    adminLeagues: League[];
    /** Current submission mode from parent */
    submissionMode: "single" | "batch" | "bulk-manual";
    /** Callback when submission completes */
    onSubmitted?: () => void;
}

/**
 * ProxySubmissionSection - Collapsible section for submitting steps on behalf of proxy members
 * 
 * Only visible to league admins/owners. Includes:
 * - League selection dropdown
 * - Proxy member selection/creation
 * - Authorization consent declaration
 * - Submission forms (reuses regular forms with proxyMemberId)
 */
export function ProxySubmissionSection({
    adminLeagues,
    submissionMode,
    onSubmitted
}: ProxySubmissionSectionProps) {
    const [expanded, setExpanded] = useState(false);
    const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
    const [selectedProxy, setSelectedProxy] = useState<ProxyMember | null>(null);
    const [consent, setConsent] = useState(false);

    // Don't render if user has no admin leagues
    if (adminLeagues.length === 0) {
        return null;
    }

    const handleLeagueChange = (leagueId: string) => {
        setSelectedLeagueId(leagueId);
        setSelectedProxy(null);
        setConsent(false);
    };

    const handleProxySelect = (proxy: ProxyMember | null) => {
        setSelectedProxy(proxy);
        setConsent(false);
    };

    return (
        <div className="mb-8">
            {/* Collapsible Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-left hover:bg-amber-500/20 transition"
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">👤</span>
                    <div>
                        <h3 className="font-medium text-amber-100">Submit for Proxy Member</h3>
                        <p className="text-sm text-amber-200/70">
                            Submit steps on behalf of someone who hasn&apos;t signed up yet
                        </p>
                    </div>
                </div>
                <span className="text-amber-400 text-xl">
                    {expanded ? "−" : "+"}
                </span>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-slate-900/50 p-4 space-y-4">
                    {/* Step 1: League Selection */}
                    <div>
                        <label className="text-sm font-medium text-amber-200 block mb-2">
                            1. Select League
                        </label>
                        <select
                            value={selectedLeagueId}
                            onChange={(e) => handleLeagueChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                        >
                            <option value="">Choose a league...</option>
                            {adminLeagues.map((league) => (
                                <option key={league.id} value={league.id}>
                                    {league.name} ({league.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Step 2: Proxy Member Selection */}
                    {selectedLeagueId && (
                        <div>
                            <label className="text-sm font-medium text-amber-200 block mb-2">
                                2. Select or Create Proxy Member
                            </label>
                            <ProxyMembersDropdown
                                leagueId={selectedLeagueId}
                                selectedProxy={selectedProxy}
                                onSelectProxy={handleProxySelect}
                            />
                        </div>
                    )}

                    {/* Step 3: Consent Declaration */}
                    {selectedProxy && (
                        <div>
                            <label className="text-sm font-medium text-amber-200 block mb-2">
                                3. Authorization Declaration
                            </label>
                            <ConsentDeclaration
                                consentType="proxy_submission"
                                checked={consent}
                                onCheckedChange={setConsent}
                                proxyId={selectedProxy.id}
                                leagueId={selectedLeagueId}
                            />
                        </div>
                    )}

                    {/* Step 4: Submission Forms */}
                    {selectedProxy && consent && (
                        <div className="pt-4 border-t border-slate-700">
                            <div className="mb-4 rounded-lg bg-amber-600/20 border border-amber-600/40 p-3">
                                <p className="text-sm text-amber-200">
                                    <span className="font-semibold">Submitting for:</span>{" "}
                                    <span className="text-amber-100">{selectedProxy.display_name}</span>
                                </p>
                            </div>

                            {submissionMode === "single" ? (
                                <SubmissionForm
                                    leagueId={selectedLeagueId}
                                    proxyMemberId={selectedProxy.id}
                                    proxyDisplayName={selectedProxy.display_name}
                                    onSubmitted={onSubmitted}
                                    settings={{
                                        allow_manual_entry: true,
                                        require_verification_photo: false
                                    }}
                                />
                            ) : submissionMode === "batch" ? (
                                <BatchSubmissionForm
                                    leagueId={selectedLeagueId}
                                    proxyMemberId={selectedProxy.id}
                                    onSubmitted={onSubmitted}
                                />
                            ) : (
                                <BulkUnverifiedForm
                                    leagueId={selectedLeagueId}
                                    onSubmitted={onSubmitted}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
