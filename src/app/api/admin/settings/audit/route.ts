import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized } from "@/lib/api";

/**
 * GET /api/admin/settings/audit
 * Returns recent audit log entries for settings changes
 * SuperAdmin only
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  // Check if user is superadmin
  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from("users")
    .select("is_superadmin")
    .eq("id", user.id)
    .single();

  if (!userData?.is_superadmin) {
    return json({ error: "SuperAdmin access required" }, { status: 403 });
  }

  // Get query params
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const settingKey = url.searchParams.get("key");

  // Build query
  let query = adminClient
    .from("app_settings_audit")
    .select(`
      id,
      setting_key,
      old_value,
      new_value,
      changed_by,
      changed_at,
      change_reason,
      user:changed_by(display_name)
    `)
    .order("changed_at", { ascending: false })
    .limit(limit);

  // Filter by setting key if provided
  if (settingKey) {
    query = query.eq("setting_key", settingKey);
  }

  const { data: entries, error } = await query;

  if (error) {
    console.error("Error fetching audit log:", error);
    return json({ error: error.message }, { status: 500 });
  }

  return json({ entries: entries || [] });
}
