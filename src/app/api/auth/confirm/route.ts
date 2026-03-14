import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { enrollInWorldLeague } from "@/lib/league/worldLeague";

/**
 * Token-hash based auth confirmation route.
 *
 * Replaces Supabase's default `/auth/v1/verify` endpoint so that email links
 * point to stepleague.app instead of the Supabase project URL.
 *
 * Email templates use: {{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=<type>
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/sign-in?error=invalid_link`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "recovery" | "signup" | "magiclink" | "invite" | "email_change" | "email",
  });

  if (error) {
    console.error("[Auth Confirm] verifyOtp failed:", error.message, "| type:", type);

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password?error=link_expired`);
    }
    return NextResponse.redirect(`${origin}/sign-in?error=link_expired`);
  }

  // Sync user to public.users table (required for foreign key constraints)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const adminClient = createAdminClient();
    await adminClient.from("users").upsert({
      id: user.id,
      display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
    }, { onConflict: "id", ignoreDuplicates: false });

    // PRD 44: Auto-enroll in World League (silent failure)
    // Skip for password recovery — user already exists (PRD 57)
    if (type !== "recovery") {
      await enrollInWorldLeague(adminClient, user.id, { method: "auto" });
    }
  }

  // Redirect based on auth type
  switch (type) {
    case "recovery":
      return NextResponse.redirect(`${origin}/update-password`);
    case "email_change":
      return NextResponse.redirect(`${origin}/dashboard?email_changed=true`);
    default:
      return NextResponse.redirect(`${origin}/dashboard`);
  }
}
