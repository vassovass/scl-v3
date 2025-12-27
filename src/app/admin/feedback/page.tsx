import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminFeedbackClient from "@/components/admin/AdminFeedbackClient";

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
            <div className="p-8 text-rose-400">
                Error loading feedback: {error.message}
            </div>
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
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">User Feedback</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Manage and triage user-submitted feedback
                    </p>
                </div>
                <a
                    href="/admin/kanban"
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition self-start"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Full Kanban Board
                </a>
            </div>

            <AdminFeedbackClient initialItems={items} />
        </div>
    );
}
