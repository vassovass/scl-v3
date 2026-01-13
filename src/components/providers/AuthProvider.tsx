"use client";

import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { analytics, identifyUser, clearUser, trackEvent } from "@/lib/analytics";


interface AuthContextValue {
  user: User | null;         // The currently "acting" user (proxy or real)
  realUser: User | null;     // The actual authenticated user (always the real login)
  session: Session | null;
  loading: boolean;
  signOut: (redirectTo?: string) => Promise<void>;
  switchProfile: (profile: User | null) => void;
  isActingAsProxy: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<User | null>(null);

  // Track if user was already identified (prevent duplicate events)
  const identifiedUserRef = useRef<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      const initialSession = data.session ?? null;
      setSession(initialSession);
      setLoading(false);
      // Default active profile to real user on load
      if (initialSession?.user) {
        setActiveProfile(initialSession.user);
      }

      // Identify user if already logged in
      if (initialSession?.user && identifiedUserRef.current !== initialSession.user.id) {
        identifyUser(initialSession.user.id, {
          email: initialSession.user.email || '',
          created_at: initialSession.user.created_at || '',
        });
        identifiedUserRef.current = initialSession.user.id;
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession) => {
      setSession(newSession);
      // Reset active profile to real user on auth change (login/logout)
      if (newSession?.user) {
        setActiveProfile(newSession.user);
      } else {
        setActiveProfile(null);
      }

      // Handle analytics based on auth event
      handleAuthAnalytics(event, newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handle analytics for different auth events
  const handleAuthAnalytics = (event: AuthChangeEvent, newSession: Session | null) => {
    switch (event) {
      case 'SIGNED_IN':
        if (newSession?.user && identifiedUserRef.current !== newSession.user.id) {
          // Identify user for per-user tracking across all tools
          identifyUser(newSession.user.id, {
            email: newSession.user.email || '',
            created_at: newSession.user.created_at || '',
          });
          identifiedUserRef.current = newSession.user.id;

          // Track login event
          const provider = newSession.user.app_metadata?.provider;
          analytics.login(provider === 'google' ? 'google' : 'email');
        }
        break;

      case 'SIGNED_OUT':
        // Clear user identity
        clearUser();
        identifiedUserRef.current = null;
        analytics.logout();
        break;

      case 'USER_UPDATED':
        // Re-identify with updated info
        if (newSession?.user) {
          identifyUser(newSession.user.id, {
            email: newSession.user.email || '',
            created_at: newSession.user.created_at || '',
          });
        }
        break;
    }
  };

  const signOut = async (redirectTo = "/sign-in?signedOut=true") => {
    await supabase.auth.signOut();
    setSession(null);
    setActiveProfile(null);
    router.push(redirectTo);
  };

  const switchProfile = (profile: User | null) => {
    if (!session?.user) return;
    // If null passed, reset to real user
    setActiveProfile(profile || session.user);

    // Track the switch
    if (profile && profile.id !== session.user.id) {
      trackEvent("profile_switch", {
        category: "user",
        action: "switch",
        target_profile_id: profile.id
      });
    }
  };

  const value: AuthContextValue = useMemo(() => ({
    user: activeProfile, // This makes most components automatically use the active profile
    realUser: session?.user ?? null, // Access original user if needed
    session,
    loading,
    signOut,
    switchProfile,
    isActingAsProxy: !!(activeProfile && session?.user && activeProfile.id !== session.user.id),
  }), [activeProfile, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for consuming auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

