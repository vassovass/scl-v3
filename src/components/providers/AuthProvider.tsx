"use client";

import { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Core auth state
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
      .select("id, display_name, is_proxy, managed_by")
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
  // Initialize auth and proxies
  // ============================================================================
  useEffect(() => {
    const initAuth = async () => {
      // Get initial session
      const { data } = await supabase.auth.getSession();
      const initialSession = data.session ?? null;
      setSession(initialSession);

      // Update session cache for API client
      if (initialSession) {
        setCachedSession(
          initialSession.access_token,
          initialSession.user?.id ?? null,
          initialSession.expires_at ?? null
        );
      }

      if (initialSession?.user) {
        // Fetch user profile
        const profile = await fetchUserProfile(initialSession.user.id);
        if (profile) {
          setUserProfile(profile);

          // Fetch proxies
          const { data: proxyData } = await supabase
            .from("users")
            .select("id, display_name, is_proxy, managed_by")
            .eq("managed_by", initialSession.user.id)
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

        // Identify for analytics
        if (identifiedUserRef.current !== initialSession.user.id) {
          identifyUser(initialSession.user.id, {
            email: initialSession.user.email || '',
            created_at: initialSession.user.created_at || '',
          });
          identifiedUserRef.current = initialSession.user.id;
        }
      }

      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession) => {
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
      }

      // On sign in, refresh profile and proxies
      if (event === 'SIGNED_IN' && newSession?.user) {
        const profile = await fetchUserProfile(newSession.user.id);
        if (profile) {
          setUserProfile(profile);
          setActiveProfile(profile);
          await refreshProxies();
        }
      }
    });

    return () => {
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

    // Clear proxy state first
    console.log('[AuthProvider] Clearing proxy state...');
    setUserProfile(null);
    setActiveProfile(null);
    setManagedProxies([]);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);

    // Clear session cache for API client
    clearCachedSession();

    // Clear service worker caches and browser storage (non-blocking)
    clearAllAppState().catch((e) => console.warn('[AuthProvider] clearAllAppState failed:', e));

    // Clear session state locally first to ensure UI updates
    setSession(null);

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
    router.push(redirectTo);
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
