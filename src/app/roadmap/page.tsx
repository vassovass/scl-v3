import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import RoadmapCard from "@/components/roadmap/RoadmapCard";
import { APP_CONFIG } from "@/lib/config";

export const metadata = {
    title: `Roadmap | ${APP_CONFIG.name} `,
    description: "See what we're building and vote on upcoming features",
};

interface RoadmapItem {
    id: string;
    type: string;
    subject: string;
    description: string;
    board_status: string;
    completed_at: string | null;
    created_at: string;
    avg_priority: number;
    vote_count: number;
    comment_count: number;
    user_vote: number | null;
}

export default async function RoadmapPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminClient = createAdminClient();

    // Fetch public roadmap items with vote aggregates
    const { data: items, error } = await adminClient
        .from("feedback")
        .select(`
id,
    type,
    subject,
    description,
    board_status,
    completed_at,
    created_at
        `)
        .eq("is_public", true)
        .order("completed_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Roadmap fetch error:", error);
    }

    // Get vote aggregates
    const { data: voteAggregates } = await adminClient
        .from("roadmap_votes")
        .select("feedback_id, priority");

    // Get comment counts
    const { data: commentCounts } = await adminClient
        .from("roadmap_comments")
        .select("feedback_id");

    // Get user's votes if logged in
    let userVotes: Record<string, number> = {};
    if (user) {
        const { data: votes } = await adminClient
            .from("roadmap_votes")
            .select("feedback_id, priority")
            .eq("user_id", user.id);

        if (votes) {
            userVotes = votes.reduce((acc: Record<string, number>, v: any) => {
                acc[v.feedback_id] = v.priority;
                return acc;
            }, {});
        }
    }

    // Build aggregated items
    const roadmapItems: RoadmapItem[] = (items || []).map((item: any) => {
        const itemVotes = (voteAggregates || []).filter((v: any) => v.feedback_id === item.id);
        const avgPriority = itemVotes.length > 0
            ? itemVotes.reduce((sum: number, v: any) => sum + v.priority, 0) / itemVotes.length
            : 0;
        const commentCount = (commentCounts || []).filter((c: any) => c.feedback_id === item.id).length;

        return {
            ...item,
            avg_priority: Math.round(avgPriority * 10) / 10,
            vote_count: itemVotes.length,
            comment_count: commentCount,
            user_vote: userVotes[item.id] || null,
        };
    });

    // Categorize items
    const planned = roadmapItems
        .filter((i) => ["backlog", "todo"].includes(i.board_status))
        .sort((a, b) => b.avg_priority - a.avg_priority);

    const inProgress = roadmapItems
        .filter((i) => ["in_progress", "review"].includes(i.board_status))
        .sort((a, b) => b.avg_priority - a.avg_priority);

    const completed = roadmapItems
        .filter((i) => i.board_status === "done")
        .sort((a, b) => {
            if (a.completed_at && b.completed_at) {
                return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
            }
            return 0;
        });

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-3">
                        🗺️ Product Roadmap
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        See what we're building next. Vote on features to help us prioritize!
                    </p>
                    {!user && (
                        <p className="text-sm text-amber-400/80 mt-3">
                            <a href="/auth/login" className="underline hover:text-amber-300">Sign in</a> to vote and comment
                        </p>
                    )}
                </div>

                {/* In Progress */}
                {inProgress.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
                            In Progress
                        </h2>
                        <div className="space-y-4">
                            {inProgress.map((item) => (
                                <RoadmapCard key={item.id} item={item} isLoggedIn={!!user} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Planned */}
                {planned.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <span className="w-3 h-3 bg-sky-500 rounded-full"></span>
                            Planned
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Vote 1-10 to help us prioritize. Higher = more important to you.
                        </p>
                        <div className="space-y-4">
                            {planned.map((item) => (
                                <RoadmapCard key={item.id} item={item} isLoggedIn={!!user} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Completed */}
                {completed.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                            Completed
                        </h2>
                        <div className="space-y-4">
                            {completed.map((item) => (
                                <RoadmapCard key={item.id} item={item} isLoggedIn={!!user} isCompleted />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty state */}
                {roadmapItems.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <p className="text-lg mb-2">No roadmap items yet</p>
                        <p className="text-sm">Check back soon for updates!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
