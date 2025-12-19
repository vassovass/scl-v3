import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, serverError } from "@/lib/api";

const createLeagueSchema = z.object({
  name: z.string().min(1).max(100),
  stepweek_start: z.enum(["monday", "sunday"]).default("monday"),
});

// GET /api/leagues - List user's leagues
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    // Use admin client to bypass RLS infinite recursion in memberships policy
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("memberships")
      .select("role, leagues(id, name, stepweek_start, invite_code, created_at)")
      .eq("user_id", user.id);

    if (error) {
      return serverError(error.message);
    }

    const leagues = (data || [])
      .filter((m: any) => m.leagues !== null)
      .map((m: any) => ({
        ...m.leagues,
        role: m.role,
      }));

    return json({ leagues });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

// POST /api/leagues - Create a new league
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = createLeagueSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.message);
    }

    const { name, stepweek_start } = parsed.data;

    // Generate invite code
    const invite_code = generateInviteCode();

    // Use admin client to bypass RLS for these operations
    // This avoids the "infinite recursion" error in the memberships policy
    const adminClient = createAdminClient();

    // Ensure user exists in public.users table (required for owner_id foreign key)
    // This handles cases where the user logged in via methods that didn't trigger the callback sync
    const { error: userSyncError } = await adminClient.from("users").upsert({
      id: user.id,
      display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
      units: "metric",
      is_superadmin: false,
    }, { onConflict: "id" });

    if (userSyncError) {
      console.error("Failed to sync user to public.users:", userSyncError);
      return serverError("Failed to prepare user account. Please try again.");
    }

    // Create league
    // Database CHECK constraint requires 'mon' or 'sun' (lowercase 3-letter abbreviations)
    const stepweekDb = stepweek_start === "monday" ? "mon" : "sun";

    const { data: league, error: createError } = await adminClient
      .from("leagues")
      .insert({
        name,
        stepweek_start: stepweekDb,
        invite_code,
        owner_id: user.id,
      })
      .select()
      .single();

    if (createError) {
      return serverError(createError.message);
    }

    // Add creator as owner membership
    const { error: membershipError } = await adminClient.from("memberships").insert({
      league_id: league.id,
      user_id: user.id,
      role: "owner",
    });

    if (membershipError) {
      // If membership fails, try to clean up the league
      await adminClient.from("leagues").delete().eq("id", league.id);
      return serverError(membershipError.message);
    }

    return json({ league }, { status: 201 });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
