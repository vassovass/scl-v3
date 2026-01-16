---
name: auth-patterns
description: Supabase authentication patterns including getUser vs getSession, deadlock avoidance, session handling, and bypass patterns. Use when working with auth, sessions, cookies, or encountering auth hangs/timeouts. Keywords: auth, getUser, getSession, session, deadlock, timeout, cookie, token, Web Locks.
compatibility: Antigravity, Claude Code, Cursor
metadata:
  version: "1.0"
  project: "stepleague"
---

# Auth Patterns Skill

## Overview

Supabase auth can cause hangs and deadlocks due to the Web Locks API. This skill covers safe patterns to avoid these issues.

---

## ⚠️ Critical: getUser vs getSession

### Decision Flowchart

```
Need user info?
├─ Server-side (API route)?
│  └─ Use getUser() → More reliable, validates with server
├─ Client-side initial load?
│  └─ Use onAuthStateChange → Avoids deadlock
├─ Client-side after load?
│  └─ Use cached session from context
└─ Background/long-running task?
   └─ Parse cookie directly → No locks!
```

### Quick Reference

| Method | When to Use | Risk Level |
|--------|-------------|------------|
| `getUser()` | API routes, server components | Low - validates token |
| `getSession()` | ❌ Avoid on client | **HIGH - Can deadlock** |
| `onAuthStateChange` | Client-side initial load | Safe |
| Cookie parsing | Background tasks, fallback | Safe - no locks |

---

## Pattern 1: API Routes (Safe)

```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();
  
  // ✅ getUser is safe on server - validates with Supabase
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Continue with user...
}
```

---

## Pattern 2: Client-Side Initial Load (Safe)

```typescript
// ✅ CORRECT - Use onAuthStateChange
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'INITIAL_SESSION') {
        setSession(session);
        setLoading(false);
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

**Why?** `onAuthStateChange` doesn't acquire Web Locks like `getSession()` does.

---

## Pattern 3: Avoid getSession on Client

```typescript
// ❌ WRONG - Can deadlock!
const handleClick = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  // This can hang forever...
};

// ✅ CORRECT - Use session from context
const { session } = useAuth();
const handleClick = async () => {
  if (!session) return;
  // Use cached session
};
```

---

## Pattern 4: Background/Long-Running Tasks

For batch operations or tasks that run in the background:

```typescript
import { createClient as createArgsClient } from "@supabase/supabase-js";

// Parse token directly from cookie - NO LOCKS
function getTokenFromCookie(): string | null {
  const cookie = document.cookie
    .split('; ')
    .find(c => c.startsWith('sb-'));
  
  if (!cookie) return null;
  
  const value = decodeURIComponent(cookie.split('=')[1]);
  const parsed = JSON.parse(value);
  return parsed?.access_token;
}

// Create stateless client - SAFE
const token = getTokenFromCookie();
const tempClient = createArgsClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  }
);

// Use for background operations
await tempClient.from("submissions").insert({ ... });
```

---

## Pattern 5: Token Expiry Validation

Always check expiry before using cached tokens:

```typescript
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    const bufferMs = 60 * 1000; // 1 minute buffer
    
    return Date.now() < (expiresAt - bufferMs);
  } catch {
    return false;
  }
}

// Usage
const token = getTokenFromCookie();
if (!token || !isTokenValid(token)) {
  redirectToSignIn();
  return;
}
```

---

## Pattern 6: Session Timeout Handling

For long operations (batch uploads):

```typescript
const SESSION_TIMEOUT_MS = 5000;

async function withSessionTimeout<T>(
  operation: () => Promise<T>
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout')), SESSION_TIMEOUT_MS)
    )
  ]);
}

// Usage
try {
  const user = await withSessionTimeout(() => supabase.auth.getUser());
} catch (e) {
  if (e.message === 'Session timeout') {
    // Use cookie fallback
    const token = getTokenFromCookie();
    // ...
  }
}
```

---

## StepLeague Implementation

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth/sessionCache.ts` | Cookie parsing, token validation |
| `src/components/providers/AuthProvider.tsx` | onAuthStateChange pattern |
| `src/lib/api/client.ts` | Timeout wrapper for getUser |

### The Auth Flow

```
1. Page loads
   └─ AuthProvider uses onAuthStateChange (safe)
   
2. Session received
   └─ Cached in React context
   
3. API calls
   └─ Use cached session, not getSession()
   
4. Long operations
   └─ Use cookie parsing fallback
   
5. Session expires
   └─ Token refresh via onAuthStateChange
```

---

## Debugging Auth Issues

### Symptom: Page stuck on "Loading..."

**Causes:**
1. `getSession()` deadlock
2. onAuthStateChange never firing

**Fix:**
1. Check if using getSession on client
2. Add timeout/fallback to AuthProvider
3. Check `/reset` page to clear stale state

### Symptom: "Session timeout" in batch operations

**Cause:** Web Locks held too long

**Fix:** Use cookie parsing fallback (Pattern 4)

---

## Related Skills

- `supabase-patterns` - Database operations, MCP usage, RLS *(auth section references this skill)*
- `middleware-patterns` - Auth checks in Next.js middleware
- `api-handler` - Server-side auth in API routes

