# PRD 63: Client Error Resilience — AbortController & Timeouts

> **Order:** 63
> **Status:** 📋 Proposed
> **Type:** Architecture
> **Dependencies:** None
> **Blocks:** None (but benefits from PRD 59 for error analytics)

---

## 🎯 Objective

No AbortController usage exists in client-side fetches (only 2 files reference `abort` in the entire `src/` directory). On slow South African mobile connections (2G/3G), users experience hanging requests with no feedback. The alpha readiness audit found "Good boundaries, weak interior" — error boundaries catch crashes but individual fetches can hang indefinitely. This PRD adds request timeout infrastructure with user-friendly feedback.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/lib/errors.ts` | AppError class, `reportErrorClient` at line 266 — connect timeouts to error system |
| `src/lib/analytics.ts` | Error event tracking — fire events on timeout |
| `src/components/providers/AuthProvider.tsx` | Already has 10s hard timeout pattern to follow |
| `.claude/skills/error-handling/SKILL.md` | Error handling patterns |
| `.claude/skills/react-debugging/SKILL.md` | Infinite loops, performance patterns |
| `.claude/skills/analytics-tracking/SKILL.md` | Event tracking patterns |
| `.claude/skills/design-system/SKILL.md` | UI patterns for timeout feedback |
| `AGENTS.md` | Project rules and patterns |

---

## 🔧 MCP Servers

| Server | Usage |
|--------|-------|
| **PostHog MCP** | Verify timeout error events appear in PostHog |
| **Playwright MCP** | Simulate slow network and verify timeout UI in E2E |

---

## 🏗️ Detailed Feature Requirements

### Section A: Timeout Utility — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **`fetchWithTimeout` utility wrapping AbortController** | Client fetches hang indefinitely on slow connections | Requests abort after configurable timeout (default 15s for SA), AbortController cleanup on unmount |
| **A-2** | **Timeout error mapped to AppError** | Timeout errors are generic DOMExceptions | Timeout creates `AppError` with `TIMEOUT` error code, user-friendly message |
| **A-3** | **Timeout fires analytics event** | Can't see how often users experience timeouts | `error_occurred` event with `error_type: 'timeout'` sent to PostHog |

### Section B: User Feedback — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **"Taking longer than usual..." message after 5s** | Users see no feedback during slow requests | Subtle loading indicator text appears after 5 seconds |
| **B-2** | **Retry option after timeout** | Users must refresh entire page to retry | "Try again" button appears after timeout, retries the request |
| **B-3** | **Feedback respects design system** | Timeout UI looks inconsistent with app | Uses shadcn/ui components, CSS variables, mobile-first styling |

### Section C: Integration — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **AbortController cleanup on component unmount** | Memory leaks from abandoned requests | All useEffect fetch patterns include cleanup function that calls `abort()` |
| **C-2** | **Configurable per-route timeouts** | Some endpoints are faster/slower than others | `fetchWithTimeout(url, { timeout: 5000 })` allows per-call override |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Requests abort after timeout | Default 15s timeout fires | Vitest with mock timers |
| Slow request feedback | "Taking longer than usual..." appears after 5s | Playwright with throttled network |
| Timeout events visible | Events appear in PostHog | PostHog MCP after test session |
| No memory leaks on unmount | Cleanup assertions pass | Vitest cleanup assertions |
| Mobile-first UI | Timeout message works on mobile viewport | Playwright mobile viewport test |

---

## 🧪 Test Requirements

### Vitest
- Test `fetchWithTimeout` — abort fires after timeout
- Test AbortController cleanup on unmount
- Test error mapping to `AppError` with `TIMEOUT` code
- Test configurable timeout override
- Test retry logic

### Playwright
- E2E test with network throttling (Chrome DevTools Slow 3G) — verify timeout UI appears
- Verify "Taking longer than usual..." message renders after 5s
- Verify "Try again" button retries the request

---

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add fetchWithTimeout to common patterns section
- [ ] `error-handling` skill — Add timeout error pattern
- [ ] CHANGELOG.md — Log client resilience addition
- [ ] PRD_00_Index.md — Update PRD 63 status
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 63 — short description`

---

## 📅 Implementation Plan Reference

### Phase 1: Core Utility
1. Create `src/lib/utils/fetchWithTimeout.ts` with AbortController wrapper
2. Map timeout errors to `AppError` with `TIMEOUT` code
3. Connect to analytics event tracking

### Phase 2: Feedback UI
1. Create timeout feedback UI component (loading indicator + retry)
2. Style with shadcn/ui components, mobile-first
3. Wire retry button to re-invoke the request

### Phase 3: Integration
1. Integrate into existing fetch patterns across dashboard pages
2. Add AbortController cleanup to all useEffect fetch patterns
3. Configure per-route timeouts where needed

### Phase 4: Testing
1. Write Vitest tests for utility, error mapping, cleanup, retry
2. Write Playwright E2E tests with network throttling

---

## 🔀 Task-Optimized Structure

```
[READ-ONLY] Audit existing fetch patterns across src/ for integration points
[READ-ONLY] Check AuthProvider 10s timeout pattern as reference implementation
[WRITE] Create fetchWithTimeout utility                    [PARALLEL with below]
[WRITE] Create timeout feedback UI component               [PARALLEL with above]
[WRITE] Integrate into existing fetch patterns             [SEQUENTIAL — needs utility + UI]
[WRITE] Write Vitest + Playwright tests
```

---

## 📚 Best Practice References

- **AbortController MDN** — Standard pattern for fetch cancellation
- **React Query/SWR timeout patterns** — Configurable per-query timeouts
- **SA mobile latency** — Expect 200-600ms RTT to London (lhr1), 15s timeout gives adequate margin

---

## 🔗 Related Documents

- [Alpha Readiness Audit](../../ALPHA_READINESS_AUDIT.md) — "Good boundaries, weak interior"
- [Error Handling Skill](../../../.claude/skills/error-handling/SKILL.md)
- [PRD 59: Analytics Implementation](./PRD_59_Analytics_Implementation.md) — For error event integration

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD — proactive addition from sprint reorganization |

---

**Effort estimate:** 3-4 hours
