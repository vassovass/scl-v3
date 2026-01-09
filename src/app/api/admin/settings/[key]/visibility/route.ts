import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, badRequest } from "@/lib/api";

/**
 * PATCH /api/admin/settings/:key/visibility
 * Update visibility settings for an app setting (SuperAdmin only)
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export async function PATCH(
  request: Request,
  { params }: { params: { key: string } }
) {
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
  const { visible_to, editable_by, show_in_league_settings, show_in_user_settings } = body;

  // At least one visibility field must be provided
  if (
    visible_to === undefined &&
    editable_by === undefined &&
    show_in_league_settings === undefined &&
    show_in_user_settings === undefined
  ) {
    return badRequest("At least one visibility field must be provided");
  }

  // Get current setting for audit log
  const { data: oldSetting } = await adminClient
    .from("app_settings")
    .select("*")
    .eq("key", params.key)
    .single();

  if (!oldSetting) {
    return json({ error: "Setting not found" }, { status: 404 });
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  if (visible_to !== undefined) updateData.visible_to = visible_to;
  if (editable_by !== undefined) updateData.editable_by = editable_by;
  if (show_in_league_settings !== undefined) updateData.show_in_league_settings = show_in_league_settings;
  if (show_in_user_settings !== undefined) updateData.show_in_user_settings = show_in_user_settings;

  // Update setting
  const { data: setting, error } = await adminClient
    .from("app_settings")
    .update(updateData)
    .eq("key", params.key)
    .select()
    .single();

  if (error) {
    console.error("Error updating setting visibility:", error);
    return json({ error: error.message }, { status: 500 });
  }

  // Log to audit table
  await adminClient.from("app_settings_audit").insert({
    setting_key: params.key,
    old_value: {
      visible_to: oldSetting.visible_to,
      editable_by: oldSetting.editable_by,
      show_in_league_settings: oldSetting.show_in_league_settings,
      show_in_user_settings: oldSetting.show_in_user_settings,
    },
    new_value: {
      visible_to: setting.visible_to,
      editable_by: setting.editable_by,
      show_in_league_settings: setting.show_in_league_settings,
      show_in_user_settings: setting.show_in_user_settings,
    },
    changed_by: user.id,
    change_reason: "visibility_update",
  });

  return json({ setting });
}
