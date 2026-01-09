import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, badRequest } from "@/lib/api";

/**
 * PATCH /api/admin/settings/:key
 * Update a setting value (SuperAdmin only)
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
  const { value } = body;

  if (value === undefined) {
    return badRequest("Missing 'value' field");
  }

  // Get current setting for audit log
  const { data: oldSetting } = await adminClient
    .from("app_settings")
    .select("value")
    .eq("key", params.key)
    .single();

  if (!oldSetting) {
    return json({ error: "Setting not found" }, { status: 404 });
  }

  // Update setting
  const { data: setting, error } = await adminClient
    .from("app_settings")
    .update({
      value,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("key", params.key)
    .select()
    .single();

  if (error) {
    console.error("Error updating setting:", error);
    return json({ error: error.message }, { status: 500 });
  }

  // Log to audit table
  await adminClient.from("app_settings_audit").insert({
    setting_key: params.key,
    old_value: oldSetting.value,
    new_value: value,
    changed_by: user.id,
    change_reason: "value_update",
  });

  return json({ setting });
}
