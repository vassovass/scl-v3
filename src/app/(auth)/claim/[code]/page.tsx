"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ClaimData {
    proxy: {
        id: string;
        display_name: string;
        submission_count: number;
    };
    league: {
        id: string;
        name: string;
    } | null;
    user_already_member: boolean;
    can_claim: boolean;
}

interface ClaimPageProps {
    params: Promise<{ code: string }>;
}

export default function ClaimPage({ params }: ClaimPageProps) {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [code, setCode] = useState<string>("");
    const [claimData, setClaimData] = useState<ClaimData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Extract code from params
    useEffect(() => {
        params.then((p) => setCode(p.code));
    }, [params]);

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

            // Redirect to league
            if (data.league?.id) {
                router.push(`/league/${data.league.id}/overview`);
            } else {
                router.push("/dashboard");
            }
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

    return (
        <>
            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="Claim this profile?"
                description={`This will transfer ${claimData.proxy.submission_count} submissions to your account and add you to the league.`}
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
                            Someone has been tracking steps for you!
                        </p>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-4">
                        <div className="bg-secondary/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Proxy Name</span>
                                <span className="font-medium text-foreground">
                                    {claimData.proxy.display_name}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">League</span>
                                <span className="font-medium text-primary">
                                    {claimData.league?.name || "Unknown"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Submissions</span>
                                <span className="font-medium text-emerald-400">
                                    {claimData.proxy.submission_count} entries
                                </span>
                            </div>
                        </div>

                        {claimData.user_already_member && (
                            <div className="bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] rounded-lg p-3 text-sm text-[hsl(var(--warning))]">
                                <strong>Note:</strong> You&apos;re already a member of this league.
                                Claiming will transfer the proxy submissions to your existing account.
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
