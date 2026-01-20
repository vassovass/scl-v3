import { createAdminClient } from "@/lib/supabase/server";
import { json } from "@/lib/api";

/**
 * GET /api/settings/public
 * Returns app settings that are visible to everyone (no auth required)
 * Used for: development stage badge, public feature flags, etc.
 */
export async function GET() {
  const adminClient = createAdminClient();

  // Fetch only settings that are visible to 'everyone'
  const { data: settings, error } = await adminClient
    .from("app_settings")
    .select("key, value, label, category, value_type, value_options")
    .contains("visible_to", ["everyone"])
    .order("category", { ascending: true });

  if (error) {
    console.error("Error fetching public settings:", error);
    return json({ error: error.message }, { status: 500 });
  }

  // Transform array to keyed object
  const settingsMap = (settings || []).reduce((acc: any, setting: any) => {
    acc[setting.key] = setting;
    return acc;
  }, {});

  return json({ settings: settingsMap });
}

