import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

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
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Specific error: code exchange failed (PKCE mismatch - wrong browser)
    console.error("[Auth Callback] Code exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/dashboard?error=auth_code_exchange_failed`);
  }

  // No code provided - generic auth error
  return NextResponse.redirect(`${origin}/dashboard?error=auth_callback_failed`);
}


