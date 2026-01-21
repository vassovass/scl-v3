import { NextResponse, type NextRequest } from "next/server";

type CookieOptions = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Derive default Supabase auth cookie name (matches supabase-js defaultStorageKey)
  const baseUrl = new URL(supabaseUrl);
  const storageKey = `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;

  const getCookieValue = (name: string): string | undefined => {
    return request.cookies.get(name)?.value;
  };

  const base64UrlToString = (input: string): string => {
    // atob expects standard base64
    let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    return atob(b64);
  };

  const stringToBase64Url = (input: string): string => {
    // btoa produces standard base64
    const b64 = btoa(input);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  };

  const readChunkedCookie = (key: string): string | null => {
    const direct = getCookieValue(key);
    const chunk0 = getCookieValue(`${key}.0`);

    // If chunk0 exists, treat as chunked and ignore direct (direct may be stale leftover)
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

  type SessionLike = {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number; // seconds since epoch
    expires_in?: number;
    token_type?: string;
    user?: unknown;
  };

  const decodeSession = (raw: string): SessionLike | null => {
    try {
      // @supabase/ssr prefixes base64url-encoded cookies with "base64-"
      const prefix = "base64-";
      const decoded =
        raw.startsWith(prefix) ? base64UrlToString(raw.slice(prefix.length)) : raw;
      return JSON.parse(decoded) as SessionLike;
    } catch {
      return null;
    }
  };

  const encodeSessionCookie = (session: SessionLike): string => {
    const json = JSON.stringify(session);
    return `base64-${stringToBase64Url(json)}`;
  };

  const clearAuthCookies = () => {
    // Clear direct + chunks defensively
    const toClear: string[] = [storageKey];
    for (let i = 0; i < 50; i++) {
      toClear.push(`${storageKey}.${i}`);
    }

    for (const name of toClear) {
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
      });
    }
  };

  const setChunkedAuthCookie = (value: string) => {
    // Chunk to stay comfortably under typical cookie limits (bytes)
    const MAX = 3000;
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += MAX) {
      chunks.push(value.slice(i, i + MAX));
    }

    // Clear stale chunks first
    clearAuthCookies();

    const secure = request.nextUrl.protocol === "https:";
    const common = {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    if (chunks.length <= 1) {
      response.cookies.set(storageKey, chunks[0] ?? "", common);
      return;
    }

    chunks.forEach((chunk, idx) => {
      response.cookies.set(`${storageKey}.${idx}`, chunk, common);
    });
  };

  // Try to read current session from cookies (without importing supabase-js in Edge runtime)
  const rawCookie = readChunkedCookie(storageKey);
  let session: SessionLike | null = rawCookie ? decodeSession(rawCookie) : null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = session?.expires_at ?? 0;
  const isExpiredOrSoon = !!session && expiresAt > 0 && expiresAt - nowSeconds < 60;

  // If expired (or nearly), attempt refresh using refresh_token
  if (session?.refresh_token && isExpiredOrSoon) {
    try {
      const tokenUrl = new URL("auth/v1/token", baseUrl);
      tokenUrl.searchParams.set("grant_type", "refresh_token");

      const refreshRes = await fetch(tokenUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (refreshRes.ok) {
        const refreshed = (await refreshRes.json()) as SessionLike;

        // Some responses include expires_in but not expires_at; normalize
        const normalized: SessionLike = {
          ...refreshed,
          expires_at:
            refreshed.expires_at ??
            (refreshed.expires_in ? nowSeconds + refreshed.expires_in : undefined),
        };

        session = normalized;
        setChunkedAuthCookie(encodeSessionCookie(normalized));
      } else {
        // Refresh failed -> clear cookies to avoid redirect loops with invalid session
        clearAuthCookies();
        session = null;

        // FIX: Redirect immediately on refresh failure for protected paths
        // This prevents expired sessions from reaching the dashboard
        const pathname = request.nextUrl.pathname;
        const isProtectedPath = pathname.startsWith('/dashboard') ||
                                pathname.startsWith('/league') ||
                                pathname.startsWith('/settings') ||
                                pathname.startsWith('/submissions');

        if (isProtectedPath) {
          console.log('[Middleware] Session refresh failed, redirecting to sign-in');
          return NextResponse.redirect(new URL('/sign-in?redirect=' + pathname, request.url));
        }
      }
    } catch {
      // Network or parsing error - keep existing cookie as-is
    }
  }

  const isAuthenticated = !!session?.access_token;

  // Protected routes - redirect to sign-in if not authenticated
  const protectedPaths = ["/dashboard", "/league", "/admin", "/settings", "/claim"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    // Preserve full path including query params for post-login redirect
    const fullPath = request.nextUrl.pathname + request.nextUrl.search;
    url.searchParams.set("redirect", fullPath);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ["/sign-in", "/sign-up"];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

