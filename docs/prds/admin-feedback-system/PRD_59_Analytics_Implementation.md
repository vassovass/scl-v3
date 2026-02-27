# PRD 59: Analytics Implementation — Wire Up the Engine

> **Order:** 59
> **Status:** 📋 Proposed
> **Type:** Feature
> **Dependencies:** None (analytics infrastructure already exists)
> **Blocks:** PRD 32 (Admin Analytics)

---

## 🎯 Objective

Wire up the existing analytics infrastructure that's already built but not connected. The codebase defines 70+ event types but only ~20 are actually called. Page views aren't tracked on most pages. Error events are defined but never fired. For alpha, we need to track: WHERE users go, WHAT breaks, and how the app PERFORMS for SA users.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/lib/analytics.ts` | Master analytics module — all event definitions live here |
| `src/lib/errors.ts` | `AppError` class — connect to error analytics |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout — add page view tracking |
| `src/app/(dashboard)/submit-steps/page.tsx` | Submit steps — key funnel step |
| `src/components/providers/AuthProvider.tsx` | `identifyUser` already wired ✅ |
| `.claude/skills/analytics-tracking/SKILL.md` | Analytics patterns and event conventions |
| `.claude/skills/error-handling/SKILL.md` | Error handling patterns |

---

## 🏗️ Detailed Feature Requirements

### Section A: Page View Tracking — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Dashboard page views tracked** | Can't see if users reach dashboard | `page_view` event fires on `/dashboard` load |
| **A-2** | **Submit Steps page views tracked** | Can't see if users find submission flow | `page_view` event fires on `/submit-steps` load |
| **A-3** | **Leaderboard page views tracked** | Can't measure competition engagement | `page_view` event fires on `/leaderboard` load |
| **A-4** | **Settings page views tracked** | Can't see profile completion behavior | `page_view` event fires on `/settings` load |

### Section B: Error Tracking — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **AppError connected to analytics** | Errors go to console, not analytics | `error_occurred` event fired when AppError is created |
| **B-2** | **Error boundaries report to analytics** | Crash recovery not tracked | Error boundaries fire `error_occurred` with component stack |
| **B-3** | **Client-side API errors tracked** | Can't see what API errors users hit | Failed API calls fire error event with status code and endpoint |

### Section C: Performance Tracking — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Page load time tracked for SA users** | Can't measure real user latency | Navigation timing data sent as performance event |
| **C-2** | **Slow API calls detected** | Can't identify bottleneck endpoints | API calls >2s fire performance warning event |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Page views visible | All 4 key pages tracked in PostHog | Check PostHog after test session |
| Error events visible | Errors appear in analytics | Trigger test error, verify in PostHog |
| No performance impact | Analytics don't block rendering | Lighthouse check, no CLS regression |
| SA latency visible | Page load times from SA visible | Check performance events after SA session |

---

## 📅 Implementation Plan Reference

### Phase 1: Page Views
1. Create `usePageView` hook or equivalent tracking
2. Add to dashboard, submit-steps, leaderboard, settings

### Phase 2: Error Tracking
1. Connect `AppError` to analytics event
2. Add analytics to error boundary catch handlers
3. Add client-side API error tracking

### Phase 3: Performance
1. Track navigation timing on key pages
2. Add slow-API detection

---

## 🔗 Related Documents

- [Alpha Readiness Audit](../../ALPHA_READINESS_AUDIT.md) — Analytics section
- [PRD 32: Admin Analytics](./PRD_32_Admin_Analytics.md) — Depends on this data
- [Analytics Tracking Skill](../../../.claude/skills/analytics-tracking/SKILL.md)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD from Alpha Readiness Audit |
