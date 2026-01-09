import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized } from "@/lib/api";

/**
 * POST /api/admin/settings/presets/:id/apply
 * Apply a preset to current settings (bulk update)
 * SuperAdmin only
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from("users")
    .select("is_superadmin")
    .eq("id", user.id)
    .single();

  if (!userData?.is_superadmin) {
    return json({ error: "SuperAdmin access required" }, { status: 403 });
  }

  // Get the preset
  const { data: preset, error: presetError } = await adminClient
    .from("app_settings_presets")
    .select("*")
    .eq("id", params.id)
    .single();

  if (presetError || !preset) {
    return json({ error: "Preset not found" }, { status: 404 });
  }

  const settingsToApply = preset.settings as Record<string, unknown>;
  const results: { key: string; success: boolean; error?: string }[] = [];

  // Apply each setting from the preset
  for (const [key, value] of Object.entries(settingsToApply)) {
    // Get old value for audit
    const { data: oldSetting } = await adminClient
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .single();

    // Update setting
    const { error: updateError } = await adminClient
      .from("app_settings")
      .update({
        value,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("key", key);

    if (updateError) {
      results.push({ key, success: false, error: updateError.message });
    } else {
      results.push({ key, success: true });

      // Log to audit
      await adminClient.from("app_settings_audit").insert({
        setting_key: key,
        old_value: oldSetting?.value,
        new_value: value,
        changed_by: user.id,
        change_reason: `preset_applied:${preset.name}`,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return json({
    success: failCount === 0,
    preset: preset.name,
    applied: successCount,
    failed: failCount,
    results,
  });
}
