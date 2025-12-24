import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with drag-and-drop
const KanbanBoard = dynamic(() => import("@/components/admin/KanbanBoard"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
    ),
});

export const metadata = {
    title: "Kanban Board | Admin",
};

export default async function AdminKanbanPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/auth/login");

    // Check if superadmin
    const { data: isAdmin } = await supabase.rpc("is_superadmin");
    if (!isAdmin) return redirect("/");

    // Fetch all feedback items
    const adminClient = createAdminClient();
    const { data: feedbackItems, error } = await adminClient
        .from("feedback")
        .select("*")
        .order("priority_order", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <div className="p-8 text-rose-400">
                Error loading feedback: {error.message}
            </div>
        );
    }

    // Add default board_status if missing
    const items = (feedbackItems || []).map((item: any) => ({
        ...item,
        board_status: item.board_status || "backlog",
        is_public: item.is_public || false,
        priority_order: item.priority_order || 0,
    }));

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Kanban Board</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Drag cards to update status. Click 🌐/🔒 to toggle public visibility.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">
                        {items.length} items
                    </span>
                    <a
                        href="/admin/feedback"
                        className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
                    >
                        View Feedback List →
                    </a>
                </div>
            </div>

            <KanbanBoard initialItems={items} />

            <div className="text-xs text-slate-500 mt-4">
                <strong>Legend:</strong>{" "}
                <span className="inline-block px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded mr-2">Bug</span>
                <span className="inline-block px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded mr-2">Feature</span>
                <span className="inline-block px-1.5 py-0.5 bg-sky-500/20 text-sky-400 rounded mr-2">Improvement</span>
                <span className="inline-block px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded mr-2">🌐 Public</span>
            </div>
        </div>
    );
}
