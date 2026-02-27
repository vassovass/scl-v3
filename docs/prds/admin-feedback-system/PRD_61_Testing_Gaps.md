# PRD 61: Testing Gaps — January Regression Prevention

> **Order:** 61
> **Status:** 📋 Proposed
> **Type:** Architecture
> **Dependencies:** None
> **Blocks:** None

---

## 🎯 Objective

Add the specific tests that would have caught the January 2026 production errors (React Error #310, "The operation is insecure", login failures). Current test suite validates that features work — but not that failures are handled gracefully. 1,100+ tests exist but zero test the exact failure modes that took down production.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/lib/utils/safeStorage.ts` | Storage wrapper — test SecurityError handling |
| `src/components/providers/AuthProvider.tsx` | Auth state — test with broken storage |
| `src/app/global-error.tsx` | Global error boundary — test crash recovery |
| `src/app/(dashboard)/error.tsx` | Route-level error boundary |
| `e2e/error-handling.spec.ts` | Existing E2E error tests — expand these |
| `playwright.config.ts` | E2E config — add Firefox/Safari |
| `src/components/analytics/PostHogProvider.tsx` | PostHog init — test failure mode |
| `.claude/skills/testing-patterns/SKILL.md` | Testing patterns and mocking strategies |
| `.claude/skills/react-debugging/SKILL.md` | Infinite loops, useMemo/useCallback patterns |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Playwright MCP** | Add Firefox/WebKit projects, cross-browser smoke test |
| **Supabase MCP** | Verify storage-blocked auth still works |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit existing test coverage for storage, error boundaries, auth |
| 2 | `[WRITE]` | Add safeStorage SecurityError tests `[PARALLEL with Phase 3]` |
| 3 | `[WRITE]` | Add error boundary render + recovery tests `[PARALLEL with Phase 2]` |
| 4 | `[WRITE]` | Add Firefox + WebKit to playwright.config.ts `[PARALLEL with Phase 2]` |
| 5 | `[WRITE]` | Add auth failure tests (500, timeout, PostHog init) `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Add cross-browser smoke test E2E `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Storage Security Tests — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **safeStorage handles SecurityError** | January "operation is insecure" crash | `safeGetItem` returns null when localStorage throws SecurityError |
| **A-2** | **AuthProvider works with blocked storage** | Login cascade failure in private browsing | AuthProvider initializes without crash when storage unavailable |
| **A-3** | **E2E test with storage blocked** | Browser-specific storage restrictions | Sign-in flow completes with localStorage blocked |

### Section B: Error Boundary Tests — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Global error boundary renders** | React Error #310 white screen | `global-error.tsx` renders error UI when child throws |
| **B-2** | **Route error boundary recovers** | Dashboard crash takes down app | `error.tsx` renders with retry button, retry works |
| **B-3** | **Error boundary reports to analytics** | Crashes invisible to monitoring | Error boundary calls `sendBeacon` with error details |

### Section C: Browser Compatibility — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Firefox added to Playwright config** | January errors hit Firefox, E2E only runs Chromium | `playwright.config.ts` includes `firefox` project |
| **C-2** | **WebKit added to Playwright config** | iOS Safari untested | `playwright.config.ts` includes `webkit` project |
| **C-3** | **Cross-browser smoke test** | No verification core flow works across browsers | Sign in → Dashboard → Submit flow passes on all 3 browsers |

### Section D: Auth Failure Tests — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Sign-in handles 500 server error** | No test for API failures during login | Error message shown on 500 response |
| **D-2** | **Sign-in handles network timeout** | No test for slow SA connections | Graceful timeout handling with retry option |
| **D-3** | **PostHog init failure doesn't crash app** | Blocked analytics script crashes provider | Children render normally when PostHog init throws |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Storage tests pass | All 3 green | `npm test -- safeStorage` |
| Error boundary tests pass | All 3 green | `npm test -- error` |
| Firefox E2E passes | Core flow green | `npx playwright test --project=firefox` |
| Auth failure tests pass | All 3 green | `npm test -- auth` |
| Zero regression | No existing tests break | Full test suite green |

---

## 📅 Implementation Plan Reference

### Phase 1: Unit Tests
1. Add safeStorage SecurityError tests
2. Add AuthProvider blocked-storage tests
3. Add PostHog init failure test
4. Add error boundary render tests

### Phase 2: E2E Expansion
1. Add Firefox and WebKit to Playwright config
2. Add storage-blocked E2E test
3. Add cross-browser smoke test

### Phase 3: Auth Failure Tests
1. Add sign-in API error handling tests
2. Add network timeout tests

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add cross-browser testing requirement
- [ ] `testing-patterns` skill — Add storage mock and error boundary test patterns
- [ ] CHANGELOG.md — Log testing gap fixes
- [ ] PRD_00_Index.md — Update PRD 61 status to ✅ Complete
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 61 — short description`

## 📚 Best Practice References

- **Storage mocking:** Use `vi.stubGlobal` to simulate `SecurityError` on `localStorage.getItem`
- **Error boundaries:** Test with `ErrorBoundary` wrapper + component that throws on render
- **Cross-browser:** Firefox + WebKit catch different security and rendering issues
- **Auth resilience:** Test with `vi.fn().mockRejectedValue()` for network failures

---

## 🔗 Related Documents

- [Alpha Readiness Audit](../../ALPHA_READINESS_AUDIT.md) — Testing Gaps section
- [PRD 42: Test Coverage Expansion](./PRD_42_Test_Coverage_Expansion.md) — Related broader effort
- [Testing Patterns Skill](../../../.claude/skills/testing-patterns/SKILL.md)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD from Alpha Readiness Audit |
