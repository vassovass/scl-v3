import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";

export const metadata = {
    title: "Feedback | Admin",
};

export default async function AdminFeedbackPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/auth/login");

    // Check if superadmin (using rpc or simple user check if you have that helper)
    // For now assuming RLS protects data access, but good to check role
    const { data: isAdmin } = await supabase.rpc("is_superadmin");
    if (!isAdmin) return redirect("/");

    const { data: feedbacks, error } = await supabase
        .from("feedback")
        .select("*, users(display_name, email)")
        .order("created_at", { ascending: false });

    if (error) {
        return <div className="p-8 text-rose-400">Error loading feedback: {error.message}</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-100">User Feedback</h1>
                <div className="text-sm text-slate-400">{feedbacks?.length || 0} items</div>
            </div>

            <div className="grid gap-4">
                {feedbacks?.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700">
                        <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wider ${item.type === "bug"
                                            ? "bg-rose-500/10 text-rose-400"
                                            : item.type === "feature"
                                                ? "bg-amber-500/10 text-amber-400"
                                                : item.type === "positive"
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : item.type === "negative"
                                                        ? "bg-red-500/10 text-red-400"
                                                        : "bg-sky-500/10 text-sky-400"
                                        }`}
                                >
                                    {item.type}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {new Date(item.created_at).toLocaleString()}
                                </span>
                                {item.user_id && (
                                    <span className="text-xs text-slate-400">
                                        by {item.users?.display_name || item.users?.email || "User"}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs uppercase text-slate-600">{item.status}</div>
                        </div>

                        {item.subject && (
                            <h3 className="mb-2 font-semibold text-slate-200">{item.subject}</h3>
                        )}

                        <p className="whitespace-pre-wrap text-sm text-slate-300">
                            {item.description}
                        </p>

                        {item.page_url && (
                            <div className="mt-3 text-xs text-slate-500">
                                Page: <a href={item.page_url} target="_blank" className="hover:text-sky-400 hover:underline">{item.page_url}</a>
                            </div>
                        )}

                        {item.screenshot_url && (
                            <div className="mt-4">
                                <details className="group">
                                    <summary className="cursor-pointer text-xs font-medium text-sky-500 hover:text-sky-400">
                                        View Screenshot
                                    </summary>
                                    <div className="mt-2 overflow-hidden rounded-lg border border-slate-700">
                                        <img
                                            src={item.screenshot_url}
                                            alt="Feedback screenshot"
                                            className="max-h-96 w-auto object-contain"
                                        />
                                    </div>
                                </details>
                            </div>
                        )}

                        {item.user_agent && (
                            <div className="mt-2 text-[10px] text-slate-600 font-mono truncate" title={item.user_agent}>
                                {item.user_agent}
                            </div>
                        )}
                    </div>
                ))}

                {feedbacks?.length === 0 && (
                    <div className="py-12 text-center text-slate-500">
                        No feedback received yet.
                    </div>
                )}
            </div>
        </div>
    );
}
