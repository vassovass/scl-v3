# PRD 59: Analytics Implementation — Wire Up the Engine

> **Order:** 59
> **Status:** 🟡 Planning
> **Type:** Feature
> **Priority:** HIGH — Analytics are useless without this
> **Source:** Alpha Readiness Audit (Analytics section)

## 🎯 Objective

Wire up the existing analytics infrastructure that's already built but not connected. The codebase defines 70+ event types but only ~20 are actually called. Page views aren't tracked on most pages. Error events are defined but never fired. The analytics engine is a Ferrari with no gas.

**For alpha, we need 5 things tracked:**
1. WHO (identifyUser) — ✅ Already fixed
2. WHERE they go (page views on key pages)
3. WHAT breaks (error events)
4. DID they use it (steps submitted — ✅ already tracked)
5. DID they share (share completed — ✅ already tracked)

## ⚠️ Agent Context (Mandatory)

Study these files before implementing:
- `src/lib/analytics.ts` — Master analytics module with all event definitions
- `src/lib/analytics/events.ts` — Event type definitions (if separate)
- `src/components/analytics/` — Analytics components (GTM, PostHog, etc.)
- `src/lib/errors.ts` — `AppError` class (connect to error analytics)
- `src/app/(dashboard)/layout.tsx` — Dashboard layout (add page view tracking here)
- `src/components/providers/AuthProvider.tsx` — identifyUser already wired ✅

## 🏗️ Detailed Feature Requirements

### Section A: Page View Tracking — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Dashboard page view tracked** | Can't see if users reach dashboard | `page_view` event fires on `/dashboard` load |
| **A-2** | **Submit Steps page view tracked** | Can't see if users find submission flow | `page_view` event fires on `/submit-steps` load |
| **A-3** | **Leaderboard page view tracked** | Can't measure engagement with competition | `page_view` event fires on `/leaderboard` load |
| **A-4** | **Settings page view tracked** | Can't see profile completion behavior | `page_view` event fires on `/settings` load |

### Section B: Error Tracking — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **AppError connected to analytics** | Errors go to console, not analytics | `analytics.error.occurred()` called when AppError is thrown |
| **B-2** | **Error boundary reports to analytics** | Crash recovery not tracked | Error boundaries fire `error_occurred` event with component stack |
| **B-3** | **API error responses tracked client-side** | Can't see what API errors users hit | Failed API calls fire error event with status code and endpoint |

### Section C: Performance Tracking — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Page load time tracked for SA users** | Can't measure real user latency | `performance.apiCall()` fires with navigation timing data |
| **C-2** | **Slow API calls logged** | Can't identify bottleneck endpoints | API calls >2s fire performance event |

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Page views visible in PostHog | All 4 key pages | Check PostHog dashboard after test session |
| Error events visible | Errors appear in analytics | Trigger a test error, verify in PostHog |
| No performance impact | Analytics don't block rendering | Lighthouse check, no CLS regression |
| SA latency visible | Can see page load times from SA | Check performance events after SA user session |

## 📅 Implementation Plan Reference

### Phase 1: Page Views (1 hour)
1. Create a `usePageView` hook that fires on route change
2. Add to dashboard, submit-steps, leaderboard, settings layouts

### Phase 2: Error Tracking (1-2 hours)
1. Connect `AppError` class to `analytics.error.occurred()`
2. Add analytics to error boundary `componentDidCatch`
3. Add client-side API error tracking to fetch wrapper

### Phase 3: Performance (1 hour)
1. Track navigation timing on key pages
2. Add slow-API detection to fetch wrapper

## 🔗 Related Documents
- [Alpha Readiness Audit](../ALPHA_READINESS_AUDIT.md) — Analytics section
- `src/lib/analytics.ts` — Event definitions

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | All | Initial PRD created from Alpha Readiness Audit |
