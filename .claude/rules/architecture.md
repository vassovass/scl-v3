---
description: Error handling, offline/PWA, league-agnostic steps, menu system, proxy pattern, caching
paths:
  - src/lib/**
  - src/hooks/**
  - src/app/**
---

# Architecture Patterns

## Error Handling — AppError System
```typescript
import { AppError, ErrorCode } from "@/lib/errors";

throw new AppError({
  code: ErrorCode.UPLOAD_TOO_LARGE,
  message: "File exceeds 5MB limit",
  context: { size: file.size },
  recoverable: true,
});
```

### Catching & Reporting
```typescript
import { normalizeError, reportErrorClient } from "@/lib/errors";
try { ... } catch (err) {
  const appError = normalizeError(err);
  reportErrorClient(appError);
  toast.error(appError.toUserMessage());
}
```

## Offline First & PWA

### Submission Queue
- `useOfflineQueue` hook — queues mutations when offline, auto-syncs via `useOfflineSync`
- IndexedDB via `src/lib/offline` for local persistence
- Queue limit: max 10 pending submissions
- Auto-cleanup: entries older than 7 days are purged
- Clear all queued data on logout

### UI Feedback
- `OfflineIndicator.tsx` — shows "Offline" badge when disconnected
- "Save Offline" button uses amber/yellow styling
- **NEVER block user** — always allow offline interaction

### Storage Security
- **NO Auth Tokens in IndexedDB or localStorage** — tokens stay in cookies only
- Supabase storage rules enforce row-level access control

### PWA
- `InstallPrompt` / `usePWA` — PWA install flow
- Package: `@ducanh2912/next-pwa` for App Shell caching
- **Do NOT manually register service worker** — the package handles it

## League-Agnostic Steps
**Steps are submitted ONCE and apply to ALL leagues a user is in.** There is no per-league step submission. The leaderboard queries aggregate steps across the user's active leagues.

## Menu System — menuConfig.ts
WordPress-style navigation:
- `MENUS` object defines all navigation items
- `prepareMenuItems(role: UserRole)` — filters by user role
- `UserRole` enum controls visibility

## "Act As" Proxy Pattern (PRD 41)
A Proxy is a `users` row where `managed_by IS NOT NULL`. Managers create and manage proxy users (ghost profiles) and submit steps on their behalf.

```typescript
const { isActingAsProxy, activeProfile, switchProfile } = useAuth();
await switchProfile(proxyUserId);  // Now all submissions use proxyUserId
await switchProfile(null);          // Back to real user
```

**Key files:**
- `src/components/providers/AuthProvider.tsx` — `switchProfile()` and `activeProfile` state
- `src/components/auth/ProfileSwitcher.tsx` — UI dropdown for switching contexts
- `src/lib/api/handler.ts` — extracts `acting_as_id` from requests
- `supabase/migrations/*_proxy_*.sql` — RLS policies for proxy visibility

**Visibility:** Proxies are ONLY visible to their `managed_by` manager. SuperAdmins see all. RLS enforces this at database level.

## Auth Recovery System
- `/reset` page — nuclear reset: clears SW caches, browser caches, localStorage, cookies
- `LoadingWatchdog` (root layout) — monitors `AuthProvider.loading`, shows toast after 15s with "Reset App" action
- `clearAppState.ts` — utility for clearing all browser state
- Sign-out flow calls `clearAllAppState()` to prevent stale state

**Service Worker:** Auth routes use `NetworkOnly` strategy in `next.config.js`:
`/sign-in`, `/sign-up`, `/reset`, `/reset-password`, `/update-password`, `/api/auth/`, `/claim/`

## Server-Side Caching
```typescript
import { createCachedFetcher, invalidateCache, CacheTag } from "@/lib/cache";
```
- `createCachedFetcher` — wraps fetch with caching
- `invalidateCache(tag)` — invalidates by tag
- `CacheTag` type — typed cache tag keys
- **Registry Rule**: Always use `CacheRegistry.BRANDING`, never inline string `'branding'`

## Redirect Pattern
Flexible default redirects — configurable per-context, not hardcoded paths.

## Server vs Client Fetching
- **Server Components** + `serverCache` for read-only data
- **Client Components** for interactive/real-time features
- Never fetch in both — pick one per data need

## Safe Script Loading
- `SafeLazy` wrapper — lazy-loads scripts safely
- Check `navigator.onLine` before loading external scripts

## Performance Rules
- Use `React.memo`, `useMemo`, `useCallback` judiciously — only when profiling shows need
- Avoid premature optimization
- Suspense boundaries at route level for code splitting
