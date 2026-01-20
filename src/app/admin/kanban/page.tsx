import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { PageLayout } from "@/components/layout/PageLayout";

// Dynamic import to avoid SSR issues with drag-and-drop
const KanbanBoard = dynamic(() => import("@/components/admin/KanbanBoard"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

    const adminClient = createAdminClient();

    // Fetch active items (not archived)
    const { data: activeItems, error: activeError } = await adminClient
        .from("feedback")
        .select("*, users(display_name)")
        .is("archived_at", null)
        .order("priority_order", { ascending: true })
        .order("created_at", { ascending: false });

    // Fetch archived items
    const { data: archivedItems, error: archivedError } = await adminClient
        .from("feedback")
        .select("*, users(display_name)")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });

    if (activeError || archivedError) {
        return (
            <PageLayout
                title="Kanban Board"
                subtitle="Drag cards to update status"
                pageId="admin_kanban"
                isEmpty={true}
                empty={{
                    icon: "⚠️",
                    title: "Error loading items",
                    description: activeError?.message || archivedError?.message || "Unknown error",
                }}
            />
        );
    }

    // Add default board_status if missing
    const items = (activeItems || []).map((item: any) => ({
        ...item,
        board_status: item.board_status || "backlog",
        is_public: item.is_public || false,
        priority_order: item.priority_order || 0,
    }));

    const archived = (archivedItems || []).map((item: any) => ({
        ...item,
        board_status: item.board_status || "backlog",
        is_public: item.is_public || false,
        priority_order: item.priority_order || 0,
    }));

    // Legend component for afterContent slot
    const Legend = () => (
        <div className="text-xs text-slate-500 mt-4 animate-fade-in animate-delay-300">
            <strong>Legend:</strong>{" "}
            <span className="inline-block px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded mr-2">Bug</span>
            <span className="inline-block px-1.5 py-0.5 bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))] rounded mr-2">Feature</span>
            <span className="inline-block px-1.5 py-0.5 bg-[hsl(var(--info)/0.2)] text-[hsl(var(--info))] rounded mr-2">Improvement</span>
            <span className="inline-block px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded mr-2">🌐 Public</span>
        </div>
    );

    return (
        <PageLayout
            title="Kanban Board"
            subtitle="Drag cards to update status. Click 🌐/🔒 to toggle public visibility."
            pageId="admin_kanban"
            actions={[
                {
                    id: "item-count",
                    label: `${items.length} items`,
                    variant: "ghost",
                    disabled: true,
                },
                {
                    id: "view-feedback-list",
                    label: "View Feedback List →",
                    href: "/admin/feedback",
                    variant: "ghost",
                },
            ]}
            isEmpty={items.length === 0 && archived.length === 0}
            empty={{
                icon: "📋",
                title: "No items yet",
                description: "Create feedback items or wait for user submissions.",
                action: {
                    label: "View Feedback Page",
                    href: "/admin/feedback",
                },
            }}
            afterContent={<Legend />}
            className="animate-fade-in"
        >
            <div className="animate-fade-slide animate-delay-100">
                <KanbanBoard initialItems={items} archivedItems={archived} />
            </div>
        </PageLayout>
    );
}

