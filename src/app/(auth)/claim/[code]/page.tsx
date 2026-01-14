"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface LeagueInfo {
    id: string;
    name: string;
    role: string;
    user_already_member: boolean;
}

interface ClaimData {
    proxy: {
        id: string;
        display_name: string;
        submission_count: number;
        created_at: string;
    };
    leagues: LeagueInfo[];
    manager: {
        id: string;
        display_name: string;
    } | null;
    can_claim: boolean;
}

type MergeStrategy = "keep_proxy_profile" | "keep_my_profile";

export default function ClaimPage() {
    const router = useRouter();
    const params = useParams();
    const { session, userProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();

    // Get code from params (useParams returns string | string[] | undefined)
    const code = typeof params.code === 'string' ? params.code : params.code?.[0];

    const [claimData, setClaimData] = useState<ClaimData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>("keep_proxy_profile");

    // Fetch claim data when authenticated
    useEffect(() => {
        if (authLoading || !code) return;

        if (!session) {
            // Redirect to sign-in with return URL
            const returnUrl = encodeURIComponent(`/claim/${code}`);
            router.push(`/sign-in?redirect=${returnUrl}`);
            return;
        }

        const fetchClaimData = async () => {
            try {
                const res = await fetch(`/api/proxy-claim/${code}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Invalid invite code");
                    return;
                }

                setClaimData(data);
            } catch (err) {
                setError("Failed to load claim details");
            } finally {
                setLoading(false);
            }
        };

        fetchClaimData();
    }, [session, authLoading, code, router]);

    const handleClaim = async () => {
        if (!claimData) return;

        setClaiming(true);
        try {
            const res = await fetch(`/api/proxy-claim/${code}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ merge_strategy: mergeStrategy }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast({
                    title: "Claim failed",
                    description: data.error || "Something went wrong",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Profile claimed!",
                description: `${data.transferred_submissions} submissions transferred to your account.`,
            });

            // Redirect to profile settings so user can customize their name
            router.push("/settings/profile?welcome=claimed");
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to claim profile",
                variant: "destructive",
            });
        } finally {
            setClaiming(false);
            setShowConfirm(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
                <div className="max-w-md w-full mx-4 p-6 rounded-lg bg-card/80 border border-destructive/50 text-center">
                    <span className="text-4xl mb-4 block">❌</span>
                    <h1 className="text-xl font-semibold text-destructive mb-2">
                        Invalid Invite Link
                    </h1>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Link
                        href="/dashboard"
                        className="inline-block px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (!claimData) {
        return null;
    }

    const hasConflictingMemberships = claimData.leagues.some(l => l.user_already_member);
    const leagueCount = claimData.leagues.length;

    return (
        <>
            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="Claim this profile?"
                description={`This will transfer ${claimData.proxy.submission_count} submissions to your account${leagueCount > 0 ? ` and add you to ${leagueCount} league${leagueCount > 1 ? 's' : ''}` : ''}.`}
                confirmText="Claim Profile"
                onConfirm={handleClaim}
                isLoading={claiming}
            />

            <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-4">
                <div className="max-w-md w-full rounded-lg bg-card/80 border border-primary/30 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[hsl(var(--info)/0.1)] p-6 text-center border-b border-[hsl(var(--info)/0.2)]">
                        <span className="text-4xl mb-3 block">👤</span>
                        <h1 className="text-xl font-semibold text-[hsl(var(--info))]">
                            Claim Your Profile
                        </h1>
                        <p className="mt-1 text-sm text-[hsl(var(--info))]/70">
                            {claimData.manager?.display_name
                                ? `${claimData.manager.display_name} has been tracking steps for you!`
                                : "Someone has been tracking steps for you!"}
                        </p>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-4">
                        {/* Profile Info */}
                        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Profile Name</span>
                                <span className="font-medium text-foreground">
                                    {claimData.proxy.display_name}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Submissions</span>
                                <span className="font-medium text-emerald-400">
                                    {claimData.proxy.submission_count} entries
                                </span>
                            </div>
                            {leagueCount > 0 && (
                                <div className="pt-2 border-t border-border/50">
                                    <span className="text-sm text-muted-foreground block mb-1">
                                        League{leagueCount > 1 ? 's' : ''}
                                    </span>
                                    <div className="space-y-1">
                                        {claimData.leagues.map((league) => (
                                            <div key={league.id} className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-primary">{league.name}</span>
                                                {league.user_already_member && (
                                                    <span className="text-xs text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.1)] px-2 py-0.5 rounded">
                                                        Already member
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Merge Strategy Selection */}
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-foreground">Profile Option</span>
                            <div className="space-y-2">
                                <label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary/30 transition">
                                    <input
                                        type="radio"
                                        name="merge_strategy"
                                        checked={mergeStrategy === "keep_proxy_profile"}
                                        onChange={() => setMergeStrategy("keep_proxy_profile")}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="font-medium text-sm text-foreground">
                                            Use &ldquo;{claimData.proxy.display_name}&rdquo;
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Keep the proxy&apos;s display name
                                        </div>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary/30 transition">
                                    <input
                                        type="radio"
                                        name="merge_strategy"
                                        checked={mergeStrategy === "keep_my_profile"}
                                        onChange={() => setMergeStrategy("keep_my_profile")}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="font-medium text-sm text-foreground">
                                            Keep my current profile
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Use your existing name: {userProfile?.display_name || "Your account"}
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {hasConflictingMemberships && (
                            <div className="bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] rounded-lg p-3 text-sm text-[hsl(var(--warning))]">
                                <strong>Note:</strong> You&apos;re already a member of some leagues.
                                Claiming will transfer the proxy submissions to your existing memberships.
                            </div>
                        )}

                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={claiming}
                            className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                        >
                            {claiming ? "Claiming..." : "Claim This Profile"}
                        </button>

                        <p className="text-xs text-center text-muted-foreground">
                            By claiming, you accept ownership of all step submissions
                            recorded under this proxy profile.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
