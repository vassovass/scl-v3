"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { BatchSubmissionForm } from "@/components/forms/BatchSubmissionForm";
import { BulkUnverifiedForm } from "@/components/forms/BulkUnverifiedForm";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { LeagueInviteControl } from "@/components/league/LeagueInviteControl";
import { ProxyMembersDropdown } from "@/components/league/ProxyMembersDropdown";

interface League {
  id: string;
  name: string;
  invite_code: string;
  stepweek_start: string;
  role?: string;
}

interface Submission {
  id: string;
  for_date: string;
  steps: number;
  verified: boolean | null;
  partial: boolean;
  created_at: string;
  verification_notes?: string | null;
  tolerance_used?: number | null;
  extracted_km?: number | null;
  extracted_calories?: number | null;
}

export default function LeaguePage() {
  const params = useParams();
  const leagueId = params.id as string;
  const { session } = useAuth();

  const [league, setLeague] = useState<League | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  const [submissionMode, setSubmissionMode] = useState<"single" | "batch" | "bulk-manual">("batch");
  const [selectedProxy, setSelectedProxy] = useState<{ id: string; display_name: string; submission_count: number } | null>(null);

  const canManageProxy = league?.role === "owner" || league?.role === "admin";

  // Get dates for current week (last 7 days)
  const getWeekDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const fetchSubmissions = useCallback(async () => {
    if (!session) return;

    try {
      // Fetch last 20 submissions regardless of date
      const res = await fetch(
        `/api/submissions?league_id=${leagueId}&user_id=${session.user.id}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  }, [session, leagueId]);

  useEffect(() => {
    if (!session) return;

    const fetchLeague = async () => {
      try {
        const response = await fetch(`/api/leagues/${leagueId}`);
        if (!response.ok) {
          console.error("Error fetching league:", response.statusText);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setLeague(data.league);
      } catch (error) {
        console.error("Error fetching league:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
    fetchSubmissions();
  }, [session, leagueId, fetchSubmissions]);

  const handleSubmissionComplete = () => {
    fetchSubmissions();
  };



  const getVerificationBadge = (verified: boolean | null) => {
    if (verified === true) {
      return <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">✓ Verified</span>;
    }
    if (verified === false) {
      return <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400">✗ Failed</span>;
    }
    return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">⏳ Pending</span>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(dateStr + "T00:00:00");
    if (dateOnly.getTime() === today.getTime()) return "Today";
    if (dateOnly.getTime() === yesterday.getTime()) return "Yesterday";

    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!league) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-50">League not found</h1>
          <Link href="/dashboard" className="mt-4 text-sky-400 hover:text-sky-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Page Title */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <h1 className="text-xl font-bold text-slate-50">{league.name}</h1>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Actions */}
        <ModuleFeedback moduleId="league-actions" moduleName="Quick Actions">
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/league/${leagueId}/leaderboard`}
              className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              data-tour="nav-leaderboard"
            >
              View Leaderboard
            </Link>
            <Link
              href={`/league/${leagueId}/analytics`}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              data-tour="nav-analytics"
            >
              📊 Analytics
            </Link>
            <LeagueInviteControl
              inviteCode={league.invite_code}
              leagueName={league.name}
            />
            {canManageProxy && (
              <>
                <Link
                  href={`/league/${leagueId}/settings`}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  data-tour="nav-settings"
                >
                  ⚙ Settings
                </Link>
                <ProxyMembersDropdown
                  leagueId={leagueId}
                  selectedProxy={selectedProxy}
                  onSelectProxy={setSelectedProxy}
                />
              </>
            )}
          </div>
        </ModuleFeedback>

        {/* Submit Steps Section */}
        <ModuleFeedback moduleId="submission-form" moduleName="Step Submission Form">
          <section className="mt-12" data-tour="submission-form">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Submit Today&apos;s Steps</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {submissionMode === "single"
                    ? "Upload a screenshot to verify your step count."
                    : submissionMode === "batch"
                      ? "Upload multiple screenshots to auto-extract data."
                      : "Manually enter step counts for multiple days (unverified)."}
                </p>
              </div>

              <div className="flex rounded-lg border border-slate-700 bg-slate-800 p-1" data-tour="batch-toggle">
                <button
                  onClick={() => setSubmissionMode("single")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${submissionMode === "single"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  Single Entry
                </button>
                <button
                  onClick={() => setSubmissionMode("batch")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${submissionMode === "batch"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  Batch Upload
                </button>
                <button
                  onClick={() => setSubmissionMode("bulk-manual")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${submissionMode === "bulk-manual"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  Bulk Manual
                </button>
              </div>
            </div>

            <div className="mt-6">
              {submissionMode === "single" ? (
                <SubmissionForm
                  leagueId={leagueId}
                  proxyMemberId={selectedProxy?.id}
                  proxyDisplayName={selectedProxy?.display_name}
                  onSubmitted={handleSubmissionComplete}
                />
              ) : submissionMode === "batch" ? (
                <BatchSubmissionForm leagueId={leagueId} onSubmitted={handleSubmissionComplete} />
              ) : (
                <BulkUnverifiedForm leagueId={leagueId} onSubmitted={handleSubmissionComplete} />
              )}
            </div>
          </section>
        </ModuleFeedback>

        {/* Your Recent Submissions */}
        <ModuleFeedback moduleId="recent-submissions" moduleName="Recent Submissions">
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-slate-100">Your Recent Submissions</h2>
            <p className="mt-2 text-sm text-slate-400">
              Your step submissions from the past 7 days.
            </p>

            <div className="mt-6">
              {submissions.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center">
                  <p className="text-slate-400">No submissions this week yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-800">
                  <table className="w-full">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Date</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Steps</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {submissions.map((sub) => {
                        const isExpanded = expandedSubmissionId === sub.id;
                        const canExpand = sub.verified === false && sub.verification_notes;

                        return (
                          <React.Fragment key={sub.id}>
                            <tr
                              className={`hover:bg-slate-900/50 ${canExpand ? 'cursor-pointer' : ''}`}
                              onClick={() => {
                                if (canExpand) {
                                  setExpandedSubmissionId(isExpanded ? null : sub.id);
                                }
                              }}
                            >
                              <td className="px-4 py-3 text-slate-100">
                                {formatDate(sub.for_date)}
                                {sub.partial && (
                                  <span className="ml-2 text-xs text-slate-500">(partial)</span>
                                )}
                                {canExpand && (
                                  <span className="ml-2 text-xs text-slate-500">
                                    {isExpanded ? '▼' : '▶'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-100">
                                {sub.steps.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {getVerificationBadge(sub.verified)}
                              </td>
                            </tr>
                            {/* Expanded verification details */}
                            {isExpanded && sub.verification_notes && (
                              <tr>
                                <td colSpan={3} className="bg-slate-900/80 px-4 py-3">
                                  <div className="rounded-md border border-slate-700 bg-slate-800/50 p-3 space-y-2">
                                    <p className="text-sm font-medium text-slate-300">Verification Details</p>
                                    <p className="text-sm text-slate-400">{sub.verification_notes}</p>
                                    {(sub.extracted_km || sub.extracted_calories) && (
                                      <div className="flex gap-4 text-xs text-slate-500 pt-1">
                                        {sub.extracted_km && <span>Distance: {sub.extracted_km} km</span>}
                                        {sub.extracted_calories && <span>Calories: {sub.extracted_calories}</span>}
                                      </div>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const issueDetails = [
                                          `Verification Issue Report`,
                                          `========================`,
                                          `Date: ${new Date().toISOString()}`,
                                          `For: ${sub.for_date}`,
                                          `Steps: ${sub.steps}`,
                                          ``,
                                          `Verification Notes:`,
                                          sub.verification_notes ?? 'None',
                                        ].join('\n');
                                        navigator.clipboard.writeText(issueDetails);
                                        alert('Issue details copied to clipboard!');
                                      }}
                                      className="mt-2 rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-600"
                                    >
                                      📋 Report Issue
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </ModuleFeedback>

      </main>
    </div>
  );
}

