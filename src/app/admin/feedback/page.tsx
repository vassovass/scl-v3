import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminFeedbackClient from "@/components/admin/AdminFeedbackClient";
import { PageLayout } from "@/components/layout/PageLayout";

export const metadata = {
    title: "User Feedback | Admin",
};

export default async function AdminFeedbackPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/auth/login");

    // Check if superadmin
    const { data: isAdmin } = await supabase.rpc("is_superadmin");
    if (!isAdmin) return redirect("/dashboard");

    // Fetch user-submitted feedback items only (has user_id)
    const adminClient = createAdminClient();
    const { data: feedbackItems, error } = await adminClient
        .from("feedback")
        .select("*, users(nickname)")
        .not("user_id", "is", null) // Only user-submitted feedback
        .order("priority_order", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <PageLayout
                title="User Feedback"
                subtitle="Manage and triage user-submitted feedback"
                pageId="admin_feedback"
                isEmpty={true}
                empty={{
                    icon: "⚠️",
                    title: "Error loading feedback",
                    description: error.message,
                }}
            />
        );
    }

    // Add default values if missing
    const items = (feedbackItems || []).map((item: any) => ({
        ...item,
        board_status: item.board_status || "backlog",
        is_public: item.is_public || false,
        priority_order: item.priority_order || 0,
    }));

    return (
        <PageLayout
            title="User Feedback"
            subtitle="Manage and triage user-submitted feedback"
            pageId="admin_feedback"
            actions={[
                {
                    id: "view-kanban",
                    label: "Full Kanban Board",
                    href: "/admin/kanban",
                    variant: "secondary",
                    icon: (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                    ),
                },
            ]}
            isEmpty={items.length === 0}
            empty={{
                icon: "📭",
                title: "No feedback yet",
                description: "User feedback submissions will appear here once submitted.",
            }}
            className="animate-fade-in"
        >
            <div className="animate-fade-slide animate-delay-100">
                <AdminFeedbackClient initialItems={items} />
            </div>
        </PageLayout>
    );
}

