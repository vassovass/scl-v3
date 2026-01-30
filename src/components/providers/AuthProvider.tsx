"use client";

import { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { createClient as createArgsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { analytics, identifyUser, clearUser } from "@/lib/analytics";
import { setCachedSession, clearCachedSession } from "@/lib/auth/sessionCache";
import { clearAllAppState } from "@/lib/utils/clearAppState";
import type { ActiveProfile } from "@/types/database";

// ============================================================================
// Types
// ============================================================================

interface AuthContextValue {
  // Core auth
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: (redirectTo?: string) => Promise<void>;
  /** True when sign-out is in progress (prevents data leakage) */
  isSigningOut: boolean;

  // Auth error state (single source of truth for auth errors)
  /** Current auth error detected from URL or callback */
  authError: string | null;
  /** Clear the auth error */
  clearAuthError: () => void;

  // PRD 41: "Act As" Proxy Context
  /** The real user's profile (never a proxy) */
  userProfile: ActiveProfile | null;
  /** Currently active profile (user or proxy) */
  activeProfile: ActiveProfile | null;
  /** True if currently acting as a proxy */
  isActingAsProxy: boolean;
  /** List of proxies managed by this user */
  managedProxies: ActiveProfile[];
  /** Switch to a different profile (proxy or back to self) */
  switchProfile: (profileId: string | null) => Promise<void>;
  /** Refresh the list of managed proxies */
  refreshProxies: () => Promise<void>;
  /** Loading state for proxies */
  proxiesLoading: boolean;
}

// Storage key for persisting active profile
const ACTIVE_PROFILE_KEY = "stepleague_active_profile_id";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

/**
 * Decode base64url to string (handles Supabase SSR encoding)
 * Wrapped in try-catch because atob() can throw on corrupted/invalid base64 data
 */
function base64UrlToString(input: string): string {
  try {
    // Convert base64url to standard base64
    let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
    // Pad to make length divisible by 4
    while (b64.length % 4 !== 0) b64 += "=";
    return atob(b64);
  } catch (err) {
    console.warn('[AuthProvider] Failed to decode base64:', err);
    return ''; // Return empty string to trigger fallback behavior
  }
}

/**
 * Parse initial session from cookie (same source as middleware uses).
 * This eliminates the race condition where NavHeader renders before onAuthStateChange fires.
 */
function getInitialSessionFromCookie(): Session | null {
  // SSR guard: ensure we're in browser with document access
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  try {
    // Match the cookie name pattern used by Supabase SSR
    const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`;
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(cookieName))
      ?.split('=')[1];

    if (!cookieValue) return null;

    // Decode the cookie value (URL encoded)
    const rawValue = decodeURIComponent(cookieValue);

    // Handle base64- prefix that Supabase SSR uses
    const prefix = "base64-";
    const decodedJson = rawValue.startsWith(prefix)
      ? base64UrlToString(rawValue.slice(prefix.length))
      : rawValue;

    const decoded = JSON.parse(decodedJson);
    if (decoded?.access_token && decoded?.user) {
      console.log('[AuthProvider] Initialized session from cookie:', decoded.user.id);
      return decoded as Session;
    }
  } catch (error) {
    console.error('[AuthProvider] Failed to parse initial session from cookie:', error);
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Core auth state - initialize session from cookie to avoid race condition
  const [session, setSession] = useState<Session | null>(getInitialSessionFromCookie());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // PRD 41: "Act As" state
  const [userProfile, setUserProfile] = useState<ActiveProfile | null>(null);
  const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);
  const [managedProxies, setManagedProxies] = useState<ActiveProfile[]>([]);
  const [proxiesLoading, setProxiesLoading] = useState(false);

  // Track if user was already identified (prevent duplicate events)
  const identifiedUserRef = useRef<string | null>(null);

  // Computed: are we acting as a proxy?
  const isActingAsProxy = useMemo(() => {
    if (!activeProfile || !userProfile) return false;
    return activeProfile.id !== userProfile.id && activeProfile.is_proxy;
  }, [activeProfile, userProfile]);

  // ============================================================================
  // Fetch user profile from database
  // ============================================================================
  const fetchUserProfile = useCallback(async (userId: string): Promise<ActiveProfile | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, is_proxy, managed_by, is_superadmin")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("[AuthProvider] Failed to fetch user profile:", error);
      return null;
    }

    return {
      id: data.id,
      display_name: data.display_name,
      is_proxy: data.is_proxy ?? false,
      managed_by: data.managed_by,
      is_superadmin: data.is_superadmin ?? false,
    };
  }, [supabase]);

  // ============================================================================
  // Fetch managed proxies
  // ============================================================================
  const refreshProxies = useCallback(async () => {
    if (!session?.user?.id) {
      setManagedProxies([]);
      return;
    }

    setProxiesLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, display_name, is_proxy, managed_by")
        .eq("managed_by", session.user.id)
        .eq("is_proxy", true)
        .is("deleted_at", null)
        .eq("is_archived", false)
        .order("display_name");

      if (error) {
        console.error("[AuthProvider] Failed to fetch proxies:", error);
        setManagedProxies([]);
        return;
      }

      const proxies: ActiveProfile[] = (data || []).map((p: any) => ({
        id: p.id,
        display_name: p.display_name,
        is_proxy: p.is_proxy ?? true,
        managed_by: p.managed_by,
      }));

      setManagedProxies(proxies);
    } finally {
      setProxiesLoading(false);
    }
  }, [session?.user?.id, supabase]);

  // ============================================================================
  // Switch profile (Act As)
  // ============================================================================
  const switchProfile = useCallback(async (profileId: string | null) => {
    // Switch back to self
    if (profileId === null) {
      setActiveProfile(userProfile);
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
      return;
    }

    // Validate the proxy belongs to this user
    const proxy = managedProxies.find(p => p.id === profileId);
    if (!proxy) {
      console.error("[AuthProvider] Cannot switch to profile - not a managed proxy:", profileId);
      return;
    }

    // Switch to proxy
    setActiveProfile(proxy);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  }, [userProfile, managedProxies]);

  // ============================================================================
  // Restore persisted profile on load
  // ============================================================================
  const restoreActiveProfile = useCallback(async (proxies: ActiveProfile[], user: ActiveProfile) => {
    const savedProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);

    if (!savedProfileId) {
      setActiveProfile(user);
      return;
    }

    // Check if saved profile is still a valid proxy
    const savedProxy = proxies.find(p => p.id === savedProfileId);
    if (savedProxy) {
      setActiveProfile(savedProxy);
    } else {
      // Invalid/expired - clear and use self
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
      setActiveProfile(user);
    }
  }, []);

  // ============================================================================
  // Clear auth error
  // ============================================================================
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // ============================================================================
  // Detect auth error from URL (single source of truth)
  // ============================================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    // Only handle auth-related errors
    if (error && (error.startsWith('auth_') || error === 'auth_callback_failed')) {
      console.log('[AuthProvider] Auth error detected from URL:', error);
      setAuthError(error);

      // Force clean slate - clear stale session that might be causing split state
      clearAllAppState();

      // Clear session state
      setSession(null);
      setUserProfile(null);
      setActiveProfile(null);
      setManagedProxies([]);
      localStorage.removeItem(ACTIVE_PROFILE_KEY);

      // Remove error from URL to prevent re-triggering
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // ============================================================================
  // Initialize auth via onAuthStateChange (primary source of auth state)
  // onAuthStateChange fires INITIAL_SESSION on page load with session from cookies
  // ============================================================================
  useEffect(() => {
    console.log('[AuthProvider] Setting up onAuthStateChange listener');
    let hasInitialized = false;

    // Fallback: if INITIAL_SESSION doesn't fire in 2s, read cookies directly
    // Supabase SDK getSession() can hang due to Web Locks API deadlock
    const fallbackTimeout = setTimeout(async () => {
      if (!hasInitialized) {
        console.warn('[AuthProvider] Fallback: INITIAL_SESSION did not fire in 2s, parsing cookies directly...');
        hasInitialized = true;

        try {
          // Parse session directly from cookies (bypasses SDK which can hang)
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const baseUrl = new URL(supabaseUrl);
          const storageKey = `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;

          // Helper to get cookie value
          const getCookieValue = (name: string): string | undefined => {
            const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
            return match ? decodeURIComponent(match[2]) : undefined;
          };

          // Helper to read chunked cookies
          const readChunkedCookie = (key: string): string | null => {
            const direct = getCookieValue(key);
            const chunk0 = getCookieValue(`${key}.0`);

            if (chunk0) {
              const chunks: string[] = [];
              for (let i = 0; i < 50; i++) {
                const part = getCookieValue(`${key}.${i}`);
                if (!part) break;
                chunks.push(part);
              }
              return chunks.length ? chunks.join("") : null;
            }
            return direct ?? null;
          };

          // Helper to decode base64url
          const base64UrlToString = (input: string): string => {
            let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
            while (b64.length % 4 !== 0) b64 += "=";
            return atob(b64);
          };

          const rawCookie = readChunkedCookie(storageKey);
          console.log('[AuthProvider] Fallback: Raw cookie found:', !!rawCookie);

          if (rawCookie) {
            // Decode the session
            const prefix = "base64-";
            const decoded = rawCookie.startsWith(prefix)
              ? base64UrlToString(rawCookie.slice(prefix.length))
              : rawCookie;
            const sessionData = JSON.parse(decoded);

            // Validation: Check expiry
            const now = Math.floor(Date.now() / 1000);
            if (sessionData.expires_at && sessionData.expires_at < now) {
              console.warn('[AuthProvider] Fallback: Session in cookie is expired', sessionData.expires_at, now);
              setLoading(false);
              return; // Stop here, clear state?
            }

            console.log('[AuthProvider] Fallback: Parsed session, user:', sessionData?.user?.id);

            if (sessionData?.access_token && sessionData?.user) {
              // Create a session-like object that matches Supabase Session type
              const fallbackSession = {
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token,
                expires_at: sessionData.expires_at,
                expires_in: sessionData.expires_in,
                token_type: sessionData.token_type || 'bearer',
                user: sessionData.user,
              } as Session;

              console.log('[AuthProvider] Fallback: Found valid session via cookie parsing!', fallbackSession.user.id);
              setSession(fallbackSession);

              // Update session cache
              setCachedSession(
                fallbackSession.access_token,
                fallbackSession.user?.id ?? null,
                fallbackSession.expires_at ?? null
              );

              // Load profile safely using a temporary, stateless client
              // This avoids using the global `supabase` client which might be deadlocked
              const tempClient = createArgsClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                  global: { headers: { Authorization: `Bearer ${fallbackSession.access_token}` } },
                  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
                }
              );

              // Fetch user profile
              const { data: profileData } = await tempClient
                .from("users")
                .select("id, display_name, is_proxy, managed_by, is_superadmin")
                .eq("id", fallbackSession.user.id)
                .single();

              if (profileData) {
                const profile = {
                  id: profileData.id,
                  display_name: profileData.display_name,
                  is_proxy: profileData.is_proxy ?? false,
                  managed_by: profileData.managed_by,
                  is_superadmin: profileData.is_superadmin ?? false,
                };
                setUserProfile(profile);

                // Fetch proxies
                const { data: proxyData } = await tempClient
                  .from("users")
                  .select("id, display_name, is_proxy, managed_by")
                  .eq("managed_by", fallbackSession.user.id)
                  .eq("is_proxy", true)
                  .is("deleted_at", null)
                  .eq("is_archived", false)
                  .order("display_name");

                const proxies: ActiveProfile[] = (proxyData || []).map((p: any) => ({
                  id: p.id,
                  display_name: p.display_name,
                  is_proxy: p.is_proxy ?? true,
                  managed_by: p.managed_by,
                }));
                setManagedProxies(proxies);
                await restoreActiveProfile(proxies, profile);
              }
            } else {
              console.log('[AuthProvider] Fallback: Cookie parsed but no valid session struct');
            }
          } else {
            console.log('[AuthProvider] Fallback: No auth cookie found');
          }
        } catch (e) {
          console.error('[AuthProvider] Fallback cookie parsing exception:', e);
        }

        setLoading(false);
      }
    }, 2000);

    // Listen for auth changes - this is the PRIMARY source of auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession) => {
      console.log('[AuthProvider] onAuthStateChange:', event, newSession ? 'session' : 'null');

      // Mark as initialized on first event
      if (!hasInitialized && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        hasInitialized = true;
        clearTimeout(fallbackTimeout);
      }

      setSession(newSession);
      handleAuthAnalytics(event, newSession);

      // Update session cache for API client
      if (newSession) {
        setCachedSession(
          newSession.access_token,
          newSession.user?.id ?? null,
          newSession.expires_at ?? null
        );
      } else {
        clearCachedSession();
      }

      // On sign out, clear proxy state
      if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setActiveProfile(null);
        setManagedProxies([]);
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
        clearCachedSession();
        setLoading(false);
      }

      // INITIAL_SESSION fires on page load with session from cookies
      // This is critical for OAuth redirects where session is set server-side
      if (event === 'INITIAL_SESSION') {
        if (newSession?.user) {
          console.log('[AuthProvider] INITIAL_SESSION with user:', newSession.user.id);

          // VALIDATION: Check if token has expired
          const expiresAt = newSession.expires_at || 0;
          const nowSeconds = Math.floor(Date.now() / 1000);

          if (expiresAt > 0 && nowSeconds >= expiresAt) {
            console.warn('[AuthProvider] Session token expired, clearing');
            clearCachedSession();
            setSession(null); // This also clears user since user is derived from session
            setLoading(false);
            return;
          }
          const profile = await fetchUserProfile(newSession.user.id);
          if (profile) {
            setUserProfile(profile);

            // Fetch proxies
            const { data: proxyData } = await supabase
              .from("users")
              .select("id, display_name, is_proxy, managed_by")
              .eq("managed_by", newSession.user.id)
              .eq("is_proxy", true)
              .is("deleted_at", null)
              .eq("is_archived", false)
              .order("display_name");

            const proxies: ActiveProfile[] = (proxyData || []).map((p: any) => ({
              id: p.id,
              display_name: p.display_name,
              is_proxy: p.is_proxy ?? true,
              managed_by: p.managed_by,
            }));
            setManagedProxies(proxies);

            // Restore persisted active profile
            await restoreActiveProfile(proxies, profile);
          }

          // Identify for analytics (PostHog + GA4)
          // Include display_name so we can identify users in session replays
          if (identifiedUserRef.current !== newSession.user.id) {
            identifyUser(newSession.user.id, {
              email: newSession.user.email || '',
              created_at: newSession.user.created_at || '',
              display_name: profile?.display_name || '',
              is_superadmin: profile?.is_superadmin || false,
            });
            identifiedUserRef.current = newSession.user.id;
          }
        } else {
          console.log('[AuthProvider] INITIAL_SESSION with no user');
        }
        setLoading(false);
        console.log('[AuthProvider] INITIAL_SESSION complete, loading=false');
      }

      // On sign in, refresh profile and proxies
      if (event === 'SIGNED_IN' && newSession?.user) {
        const profile = await fetchUserProfile(newSession.user.id);
        if (profile) {
          setUserProfile(profile);
          setActiveProfile(profile);
          await refreshProxies();
        }
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile, restoreActiveProfile, refreshProxies]);

  // ============================================================================
  // Analytics handler
  // ============================================================================
  const handleAuthAnalytics = (event: AuthChangeEvent, newSession: Session | null) => {
    switch (event) {
      case 'SIGNED_IN':
        if (newSession?.user && identifiedUserRef.current !== newSession.user.id) {
          // Note: On SIGNED_IN, we may not have the profile yet
          // The full identification with display_name happens in INITIAL_SESSION
          identifyUser(newSession.user.id, {
            email: newSession.user.email || '',
            created_at: newSession.user.created_at || '',
          });
          identifiedUserRef.current = newSession.user.id;

          const provider = newSession.user.app_metadata?.provider;
          analytics.login(provider === 'google' ? 'google' : 'email');
        }
        break;

      case 'SIGNED_OUT':
        clearUser();
        identifiedUserRef.current = null;
        analytics.logout();
        break;

      case 'USER_UPDATED':
        if (newSession?.user) {
          identifyUser(newSession.user.id, {
            email: newSession.user.email || '',
            created_at: newSession.user.created_at || '',
          });
        }
        break;
    }
  };

  // ============================================================================
  // Sign out
  // ============================================================================
  const signOut = async (redirectTo = "/sign-in?signedOut=true") => {
    console.log('[AuthProvider] signOut called, redirectTo:', redirectTo);

    // CRITICAL: Set signing-out state FIRST to prevent data leakage
    setIsSigningOut(true);

    // Clear session state IMMEDIATELY (before async operations)
    // Note: user is derived from session, so clearing session clears user too
    setSession(null);

    // Clear proxy state
    console.log('[AuthProvider] Clearing proxy state...');
    setUserProfile(null);
    setActiveProfile(null);
    setManagedProxies([]);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);

    // Clear session cache for API client
    clearCachedSession();

    // Clear service worker caches and browser storage (non-blocking)
    clearAllAppState().catch((e) => console.warn('[AuthProvider] clearAllAppState failed:', e));

    // Try to sign out from Supabase with a timeout
    // Sometimes the API call hangs, so we don't want to block the user
    console.log('[AuthProvider] Calling supabase.auth.signOut() with 5s timeout...');
    try {
      const signOutPromise = supabase.auth.signOut({ scope: 'global' });
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timed out after 5 seconds')), 5000)
      );

      const result = await Promise.race([signOutPromise, timeoutPromise]);

      if (result && 'error' in result && result.error) {
        console.error('[AuthProvider] signOut error:', result.error);
      } else {
        console.log('[AuthProvider] supabase.auth.signOut() succeeded');
      }
    } catch (error) {
      console.error('[AuthProvider] signOut failed or timed out:', error);
      // Manually clear Supabase auth cookies as fallback
      // This ensures sign-out works even when API fails
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.startsWith('sb-') || name.includes('supabase')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    }

    // Always redirect, even if signOut API call failed/timed out
    console.log('[AuthProvider] Redirecting to:', redirectTo);
    // Use window.location.href for hard navigation (clears all React state)
    window.location.href = redirectTo;
  };

  // ============================================================================
  // Context value
  // ============================================================================
  const value: AuthContextValue = {
    // Core auth
    user: session?.user ?? null,
    session,
    loading,
    signOut,
    isSigningOut,

    // Auth error state
    authError,
    clearAuthError,

    // PRD 41: "Act As" context
    userProfile,
    activeProfile,
    isActingAsProxy,
    managedProxies,
    switchProfile,
    refreshProxies,
    proxiesLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

