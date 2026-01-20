import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, badRequest } from "@/lib/api";

/**
 * GET /api/admin/settings/presets
 * Returns all settings presets
 * SuperAdmin only
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export async function GET() {
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

  const { data: presets, error } = await adminClient
    .from("app_settings_presets")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching presets:", error);
    return json({ error: error.message }, { status: 500 });
  }

  return json({ presets: presets || [] });
}

/**
 * POST /api/admin/settings/presets
 * Create a new preset from current settings
 * SuperAdmin only
 */
export async function POST(request: Request) {
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

  const body = await request.json();
  const { name, description } = body;

  if (!name) {
    return badRequest("Preset name is required");
  }

  // Get current settings to create preset
  const { data: currentSettings } = await adminClient
    .from("app_settings")
    .select("key, value")
    .not("key", "in", "('development_stage','stage_descriptions')"); // Exclude stage settings from presets

  const settingsMap: Record<string, unknown> = {};
  (currentSettings || []).forEach((s: { key: string; value: unknown }) => {
    settingsMap[s.key] = s.value;
  });

  // Create preset
  const { data: preset, error } = await adminClient
    .from("app_settings_presets")
    .insert({
      name,
      description,
      settings: settingsMap,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return json({ error: "A preset with this name already exists" }, { status: 409 });
    }
    console.error("Error creating preset:", error);
    return json({ error: error.message }, { status: 500 });
  }

  return json({ preset }, { status: 201 });
}

