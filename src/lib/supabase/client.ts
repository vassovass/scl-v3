import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export function createClient(forceNew = false) {
  if (forceNew || !supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}

/**
 * Reset the singleton client. Call this when session state becomes stale.
 */
export function resetClient() {
  supabaseInstance = null;
}

