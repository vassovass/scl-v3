# PRD 61: Testing Gaps — January Regression Prevention

> **Order:** 61
> **Status:** 🟡 Planning
> **Type:** Architecture
> **Priority:** MEDIUM — Important for stability confidence
> **Source:** Alpha Readiness Audit (Testing Gaps section)

## 🎯 Objective

Add the specific tests that would have caught the January 2026 production errors (React Error #310, "The operation is insecure", login failures). Current test suite validates features work — but not that failures are handled. 1,100+ tests exist but zero test the exact failure modes that took down production.

**The gap:** Tests validate the happy path. Production broke on the sad path.

## ⚠️ Agent Context (Mandatory)

Study these files before implementing:
- `src/lib/utils/safeStorage.ts` — Storage wrapper (test SecurityError handling)
- `src/components/providers/AuthProvider.tsx` — Auth state (test with broken storage)
- `src/app/global-error.tsx` — Global error boundary (test crash recovery)
- `src/app/(dashboard)/error.tsx` — Route-level error boundary
- `e2e/error-handling.spec.ts` — Existing E2E error tests (expand these)
- `playwright.config.ts` — E2E config (add Firefox/Safari)
- `src/components/analytics/PostHogProvider.tsx` — PostHog init (test failure mode)

## 🏗️ Detailed Feature Requirements

### Section A: Storage Security Tests — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **safeStorage handles SecurityError** | January "operation is insecure" crash | Unit test: `safeGetItem` returns null when localStorage throws SecurityError |
| **A-2** | **AuthProvider works with blocked storage** | Login cascade failure in private browsing | Unit test: AuthProvider initializes without crash when storage is unavailable |
| **A-3** | **E2E test with storage blocked** | Browser-specific storage restrictions | E2E: Sign in flow completes when localStorage is blocked via page.addInitScript |

### Section B: Error Boundary Tests — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Global error boundary renders** | React Error #310 white screen | Unit test: `global-error.tsx` renders error UI when child throws |
| **B-2** | **Route error boundary recovers** | Dashboard crash takes down app | Unit test: `error.tsx` renders with retry button, retry works |
| **B-3** | **Error boundary reports to analytics** | Crashes invisible to monitoring | Unit test: Error boundary calls `sendBeacon` with error details |

### Section C: Browser Compatibility — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Firefox added to Playwright config** | January errors hit Firefox users, E2E only runs Chromium | `playwright.config.ts` includes `firefox` project |
| **C-2** | **WebKit added to Playwright config** | iOS Safari untested | `playwright.config.ts` includes `webkit` project |
| **C-3** | **Cross-browser E2E smoke test** | No verification that core flow works across browsers | E2E: Sign in → Dashboard → Submit Steps flow passes on all 3 browsers |

### Section D: Auth Failure Tests — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Sign-in with 500 server error** | No test for API failures during login | Unit test: Sign-in page shows error message on 500 response |
| **D-2** | **Sign-in with network timeout** | No test for slow SA connections | Unit test: Sign-in handles fetch timeout gracefully |
| **D-3** | **PostHog init failure doesn't crash app** | Blocked analytics script crashes provider | Unit test: PostHogProvider renders children when PostHog init throws |

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Storage tests pass | All 3 pass | `npm test -- safeStorage` |
| Error boundary tests pass | All 3 pass | `npm test -- error` |
| Firefox E2E passes | Core flow green | `npx playwright test --project=firefox` |
| Auth failure tests pass | All 3 pass | `npm test -- auth` |
| Zero regression | No existing tests break | Full test suite green |

## 📅 Implementation Plan Reference

### Phase 1: Unit Tests (2-3 hours)
1. Add `safeStorage.test.ts` with SecurityError mocking
2. Add `AuthProvider.test.ts` with blocked storage scenario
3. Add `PostHogProvider.test.ts` with init failure scenario
4. Add error boundary render tests

### Phase 2: E2E Expansion (2 hours)
1. Add Firefox and WebKit to `playwright.config.ts`
2. Add storage-blocked E2E test
3. Add cross-browser smoke test

### Phase 3: Auth Failure Tests (1 hour)
1. Add sign-in API error handling tests
2. Add network timeout tests

## 🔗 Related Documents
- [Alpha Readiness Audit](../ALPHA_READINESS_AUDIT.md) — Testing Gaps section
- [January 2026 Incident](../ALPHA_READINESS_AUDIT.md#testing-gaps-what-would-have-caught-january-2026)

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | All | Initial PRD created from Alpha Readiness Audit |
