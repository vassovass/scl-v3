import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { APP_CONFIG } from "@/lib/config";
import RoadmapView from "@/components/roadmap/RoadmapView";

export const metadata = {
    title: `Roadmap | ${APP_CONFIG.name}`,
    description: "See what we're building next. Vote on features to help us prioritize!",
};

interface RoadmapItem {
    id: string;
    type: string;
    subject: string;
    description: string;
    board_status: string;
    target_release: string;
    completed_at: string | null;
    created_at: string;
    avg_priority: number;
    vote_count: number;
    comment_count: number;
    user_vote: number | null;
    is_agent_working: boolean;
    completion_status: string;
}

export default async function RoadmapPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminClient = createAdminClient();

    // Fetch public roadmap items
    const { data: items, error } = await adminClient
        .from("feedback")
        .select(`
      id,
      type,
      subject,
      description,
      board_status,
      target_release,
      completed_at,
      created_at,
      is_agent_working,
      completion_status
    `)
        .eq("is_public", true)
        .order("priority_order", { ascending: true })
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

    // Check if superadmin
    let isSuperAdmin = false;
    if (user) {
        const { data: isAdmin } = await supabase.rpc("is_superadmin");
        isSuperAdmin = !!isAdmin;
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
            target_release: item.target_release || "later",
            avg_priority: Math.round(avgPriority * 10) / 10,
            vote_count: itemVotes.length,
            comment_count: commentCount,
            user_vote: userVotes[item.id] || null,
            is_agent_working: item.is_agent_working || false,
            completion_status: item.completion_status || "backlog",
        };
    });

    return <RoadmapView items={roadmapItems} isLoggedIn={!!user} isSuperAdmin={isSuperAdmin} />;
}

