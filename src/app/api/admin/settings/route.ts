import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized } from "@/lib/api";

/**
 * GET /api/admin/settings
 * Returns all app settings visible to the current user
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const adminClient = createAdminClient();

  // Fetch settings based on user's visibility
  const { data: settings, error } = await adminClient
    .from("app_settings")
    .select("*")
    .order("category", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    console.error("Error fetching settings:", error);
    return json({ error: error.message }, { status: 500 });
  }

  // Transform array to keyed object
  const settingsMap = (settings || []).reduce((acc: any, setting: any) => {
    acc[setting.key] = setting;
    return acc;
  }, {});

  return json({ settings: settingsMap });
}

