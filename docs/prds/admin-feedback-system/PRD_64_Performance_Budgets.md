# PRD 64: Performance Budgets & Real User Monitoring

> **Order:** 64
> **Status:** 📋 Proposed
> **Type:** Architecture
> **Dependencies:** PRD 59 (Analytics Wiring — must be done first for event infrastructure)
> **Blocks:** None

---

## 🎯 Objective

Zero real-user performance tracking exists. The product targets South African users on mobile connections with high latency to London lhr1 (~200-600ms RTT). Currently there are no Web Vitals collection, no performance budgets, and no alerting. Performance regressions ship silently. Google's Core Web Vitals (LCP, INP, CLS) define concrete thresholds that correlate with user satisfaction. Without budgets, every deploy risks degrading the experience.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/lib/analytics.ts` | Master analytics module, `trackEvent()` function — report vitals here |
| `src/components/analytics/PostHogProvider.tsx` | PostHog initialization — performance events go here |
| `next.config.js` | Can add `<link rel="preconnect">` for Supabase domain |
| `vercel.json` | Current deployment config with `regions: ["lhr1"]` |
| `.claude/skills/analytics-tracking/SKILL.md` | Analytics patterns, dual GA4+PostHog |
| `.claude/skills/architecture-philosophy/SKILL.md` | Systems thinking, forward-looking |
| `AGENTS.md` | Project rules and patterns |

### MCP Servers

- **PostHog MCP** — Create performance dashboard, verify vitals events
- **GA4 Stape MCP** — Query Core Web Vitals reports from GA4
- **Playwright MCP** — Optional Lighthouse audit in E2E

---

## 🏗️ Detailed Feature Requirements

### Section A: Web Vitals Collection — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **LCP (Largest Contentful Paint) measured on key pages** | Can't see how fast pages render for SA users | LCP values reported to PostHog with page dimension |
| **A-2** | **INP (Interaction to Next Paint) measured** | Can't see if interactions feel responsive | INP values reported to PostHog with interaction type |
| **A-3** | **CLS (Cumulative Layout Shift) measured** | Can't see if layouts shift during load | CLS values reported to PostHog with page dimension |

### Section B: Performance Budgets — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Performance budget config defined** | No thresholds for acceptable performance | Budget config file with LCP 3.5s (SA allowance), INP 250ms, CLS 0.1 |
| **B-2** | **Budget violations logged** | Regressions ship silently | Events fire when vitals exceed budgets, visible in PostHog |
| **B-3** | **Connection type and device context included** | Can't correlate performance with user conditions | Performance events include `effectiveType` (4g/3g/2g), `deviceMemory`, page name |

### Section C: Optimizations — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Preconnect hints for Supabase domain** | DNS lookup adds ~100ms per new connection | `<link rel="preconnect" href="supabase-url">` in root layout |
| **C-2** | **Performance documentation** | Future devs don't know the budgets or monitoring setup | AGENTS.md updated with performance budget section |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Web Vitals visible | LCP, INP, CLS visible in PostHog after test session | Verify via PostHog MCP |
| Budget violations fire | Events fire when thresholds exceeded | Verify via Vitest with mock performance data |
| SA user latency context visible | Connection type, device in event properties | Verify in PostHog event properties |
| No CLS regression from preconnect | CLS stays below 0.1 | Verify via Lighthouse |

---

## 🧪 Test Requirements

- **Vitest:** Test performance budget config validation (thresholds are numbers, all 3 vitals defined)
- **Vitest:** Test Web Vitals reporter function with mock PostHog (verify event shape, dimensions)
- **Vitest:** Test budget violation detection logic
- **Playwright:** Optional Lighthouse audit as CI-only test

---

## 📝 Documentation Update Checklist

- [ ] AGENTS.md — Add performance budgets section with thresholds
- [ ] `analytics-tracking` skill — Add Web Vitals reporting pattern
- [ ] CHANGELOG.md — Log performance monitoring addition
- [ ] PRD_00_Index.md — Update PRD 64 status
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 64 — short description`

---

## 📅 Implementation Plan Reference

### Phase 1: Web Vitals Collection
1. Add `web-vitals` collection using Next.js `reportWebVitals` or manual `PerformanceObserver`

### Phase 2: PostHog Integration
1. Report vitals to PostHog as custom events with page/connection/device dimensions

### Phase 3: Performance Budgets
1. Define performance budget config and violation detection

### Phase 4: Optimizations & Documentation
1. Add preconnect hints to root layout
2. Document budgets in AGENTS.md

---

## 🔧 Task-Optimized Structure

| Mode | Task |
|------|------|
| `[READ-ONLY]` | Check if `web-vitals` is already available via Next.js (it is) |
| `[READ-ONLY]` | Audit current `analytics.ts` for existing performance event definitions |
| `[WRITE]` | Create performance budget config and reporter `[PARALLEL with below]` |
| `[WRITE]` | Add preconnect hints to root layout `[PARALLEL with above]` |
| `[WRITE]` | Wire vitals collection to PostHog `[SEQUENTIAL — needs config]` |
| `[WRITE]` | Write Vitest tests |

---

## 📚 Best Practice References

- **Google Web Vitals thresholds:** LCP <2.5s (good), <4.0s (needs improvement). SA allowance: 3.5s
- **INP:** <200ms (good), <500ms (needs improvement). Budget: 250ms
- **CLS:** <0.1 (good), <0.25 (needs improvement). Budget: 0.1
- **Next.js `reportWebVitals`:** Built-in hook available in App Router via `web-vitals` library
- **`navigator.connection.effectiveType`:** Network speed context for connection-aware monitoring

---

## 🔗 Related Documents

- [Alpha Readiness Audit](../../ALPHA_READINESS_AUDIT.md) — Infrastructure section
- [Analytics Tracking Skill](../../../.agent/skills/analytics-tracking/SKILL.md)
- [PRD 59: Analytics Implementation](./PRD_59_Analytics_Implementation.md) — Dependency for event infrastructure

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD — proactive addition from sprint reorganization |

---

**Effort estimate:** 3-4 hours
