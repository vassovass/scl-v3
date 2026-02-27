import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { enrollInWorldLeague } from "@/lib/league/worldLeague";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
        if (next !== "/update-password") {
          await enrollInWorldLeague(adminClient, user.id, { method: "auto" });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Specific error: code exchange failed (PKCE mismatch - wrong browser)
    console.error("[Auth Callback] Code exchange failed:", error.message);

    // PRD 57: Redirect to reset-password with error for expired recovery links
    if (next === "/update-password") {
      return NextResponse.redirect(`${origin}/reset-password?error=link_expired`);
    }

    return NextResponse.redirect(`${origin}/dashboard?error=auth_code_exchange_failed`);
  }

  // No code provided - generic auth error
  return NextResponse.redirect(`${origin}/dashboard?error=auth_callback_failed`);
}


