import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, badRequest } from "@/lib/api";

/**
 * PATCH /api/admin/settings/:key
 * Update a setting value (SuperAdmin only)
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

  return json({ setting });
}
