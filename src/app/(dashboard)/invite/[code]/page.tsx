import { Metadata } from "next";
import Link from "next/link";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { JoinLeagueForm } from "@/components/forms/JoinLeagueForm";

interface InvitePageProps {
    params: { code: string };
}

// Fetch league details helper
async function getLeague(code: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("leagues")
        .select("id, name, created_at")
        .eq("invite_code", code.toUpperCase())
        .single();

    if (!data) return null;

    // Get member count
    const { count } = await supabase
        .from("memberships")
        .select("*", { count: 'exact', head: true })
        .eq("league_id", data.id);

    return { ...data, member_count: count || 0 };
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
    const league = await getLeague(params.code);

    if (!league) {
        return {
            title: "League Not Found",
            description: "This invite link is invalid or expired.",
        };
    }

    const title = `Join ${league.name} on StepCountLeague`;
    const description = `You've been invited to join ${league.name}! Track your steps, compete with friends, and stay active.`;

    // Dynamic OG Image URL
    const ogImageUrl = new URL("/api/og/invite", process.env.NEXT_PUBLIC_APP_URL || "https://scl-v3.vercel.app");
    ogImageUrl.searchParams.set("name", league.name);
    ogImageUrl.searchParams.set("members", league.member_count.toString());

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: ogImageUrl.toString(),
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImageUrl.toString()],
        },
    };
}

export default async function InvitePage({ params }: InvitePageProps) {
    const league = await getLeague(params.code);
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is already a member
    let isMember = false;
    if (user && league) {
        const { data: membership } = await createAdminClient()
            .from("memberships")
            .select("id")
            .eq("league_id", league.id)
            .eq("user_id", user.id)
            .single();

        if (membership) {
            isMember = true;
        }
    }

    if (!league) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-bold text-slate-50">League Not Found</h1>
                    <p className="mt-2 text-slate-400">This invite link seems to be invalid.</p>
                    <Link
                        href="/dashboard"
                        className="mt-6 inline-block rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-500 transition"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* League Card */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 border border-slate-700 shadow-2xl text-center">
                    <div className="text-6xl mb-6">✉️</div>

                    <h2 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-2">
                        You&apos;ve been invited to
                    </h2>

                    <h1 className="text-3xl font-bold text-white mb-6">
                        {league.name}
                    </h1>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm mb-8">
                        <span>👥 {league.member_count} members</span>
                    </div>

                    <div className="space-y-4">
                        {isMember ? (
                            <div className="space-y-4">
                                <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-4 text-sky-200 text-sm">
                                    You are already a member of this league!
                                </div>
                                <Link
                                    href={`/league/${league.id}`}
                                    className="block w-full rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 transition"
                                >
                                    Go to League Dashboard
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* We reuse the Logic from Join Page but pre-fill code */}
                                <JoinLeagueForm prefilledCode={params.code} />
                                <p className="text-xs text-slate-500 mt-6">
                                    StepCountLeague is the best place to track steps with friends.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300 transition">
                        Already have an account? Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
