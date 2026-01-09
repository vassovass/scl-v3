import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, badRequest } from "@/lib/api";

/**
 * GET /api/admin/settings/presets/:id
 * Get a single preset
 * SuperAdmin only
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export async function GET(
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

  const { data: preset, error } = await adminClient
    .from("app_settings_presets")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !preset) {
    return json({ error: "Preset not found" }, { status: 404 });
  }

  return json({ preset });
}

/**
 * PATCH /api/admin/settings/presets/:id
 * Update a preset
 * SuperAdmin only
 */
export async function PATCH(
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

  const body = await request.json();
  const { name, description, settings, is_default } = body;

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (settings !== undefined) updateData.settings = settings;
  if (is_default !== undefined) updateData.is_default = is_default;

  // If setting as default, unset other defaults
  if (is_default === true) {
    await adminClient
      .from("app_settings_presets")
      .update({ is_default: false })
      .neq("id", params.id);
  }

  const { data: preset, error } = await adminClient
    .from("app_settings_presets")
    .update(updateData)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return json({ error: "A preset with this name already exists" }, { status: 409 });
    }
    console.error("Error updating preset:", error);
    return json({ error: error.message }, { status: 500 });
  }

  return json({ preset });
}

/**
 * DELETE /api/admin/settings/presets/:id
 * Delete a preset
 * SuperAdmin only
 */
export async function DELETE(
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

  const { error } = await adminClient
    .from("app_settings_presets")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Error deleting preset:", error);
    return json({ error: error.message }, { status: 500 });
  }

  return json({ success: true });
}
