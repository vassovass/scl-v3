---
description: Supabase auth patterns, deadlock prevention, PKCE flow, recovery system
paths:
  - src/lib/supabase/**
  - src/app/api/auth/**
  - src/middleware.ts
  - src/app/(auth)/**
---

# Supabase Auth Patterns

## CRITICAL: Auth Deadlock Prevention
Supabase Auth uses the Web Locks API internally. Calling `getSession()` can cause deadlocks where the app hangs indefinitely.

### Rules
1. **NEVER** call `getSession()` — it can deadlock
2. Parse `sb-*-auth-token` cookie directly instead
3. Use `getUser()` for server-side auth verification (makes a network call, no lock)

### Safe Fallback: Stateless Temporary Client
When you need a client without session persistence (e.g., in middleware or edge functions):

```typescript
const tempClient = createArgsClient(url, key, {
  global: { headers: { Authorization: `Bearer ${token}` } },
  auth: { persistSession: false, autoRefreshToken: false },
});
```

## Auth Recovery System
- `/reset` page — manual auth state reset
- `LoadingWatchdog` — auto-detects stuck auth state after 15 seconds, prompts recovery
- `clearAppState.ts` — nuclear option to clear all auth state (cookies, localStorage, IndexedDB)

### Service Worker Config
Auth-related routes MUST use `NetworkOnly` caching strategy. Never cache auth responses.

## Password Reset (PKCE Flow)

### Flow
1. `/reset-password` → `supabase.auth.resetPasswordForEmail(email, { redirectTo: .../api/auth/callback?next=/update-password })`
2. User clicks email link → `/api/auth/callback?code=XXXXX&next=/update-password`
3. Callback: `exchangeCodeForSession(code)` → sets cookies → redirect to `/update-password`
4. `AuthProvider` fires `PASSWORD_RECOVERY` event → handled in `onAuthStateChange`
5. `/update-password` → `supabase.auth.updateUser({ password })` → redirect `/dashboard?password_updated=true`

### Key Files
- `src/app/(auth)/reset-password/page.tsx` — request form
- `src/app/(auth)/update-password/page.tsx` — new password form
- `src/app/api/auth/callback/route.ts` — PKCE code exchange
- `src/components/providers/AuthProvider.tsx` — PASSWORD_RECOVERY event
- `src/components/ui/PasswordResetSuccessToast.tsx` — confirmation toast

### Middleware Rules
- `/update-password` is **protected** — requires active recovery session
- `/reset-password` redirects to dashboard if already signed in

## Admin Client Usage
In API routes, always use `adminClient` (from `withApiHandler` context) for database operations. It bypasses RLS — use carefully and validate permissions via auth levels.

## Cookie Parsing
The auth token cookie is named `sb-{project-ref}-auth-token`. Parse it for the access token when needed in middleware or edge contexts where the full Supabase client would deadlock.
