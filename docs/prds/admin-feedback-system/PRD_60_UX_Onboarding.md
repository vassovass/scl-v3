# PRD 60: UX Onboarding — First 5 Minutes

> **Order:** 60
> **Status:** 📋 Proposed
> **Type:** Feature
> **Dependencies:** None
> **Blocks:** None

---

## 🎯 Objective

Reduce the "time to aha moment" from 5-10 minutes to 2-3 minutes after signup. Currently, users see a near-empty dashboard with two lines of text, no guidance on how to submit steps, and no context for what the World League means. This is the primary reason alpha testers will drop off.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/dashboard/page.tsx` | Current dashboard — improve empty state here |
| `src/app/(dashboard)/submit-steps/page.tsx` | Step submission page — add beginner guidance |
| `src/components/tours/` | Existing tour system (7 modular tours) — leverage for onboarding |
| `src/app/(public)/page.tsx` | Homepage — hardcoded stats to fix |
| `src/app/api/auth/callback/route.ts` | Post-signup World League auto-enroll |
| `.claude/skills/design-system/SKILL.md` | CSS variables, theming, UI patterns |
| `.claude/skills/form-components/SKILL.md` | Reusable form input patterns |

---

## 🏗️ Detailed Feature Requirements

### Section A: Dashboard Empty State — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Welcome card with personalized greeting and next step** | Users see empty dashboard after signup | "Welcome, {name}! Here's how to get started" card visible |
| **A-2** | **Prominent "Submit Your First Steps" call to action** | Users don't know where to submit | Button/card linking to submit-steps with brief explanation |
| **A-3** | **"How to take a screenshot" visual guide** | Users don't know what screenshot to take | Guide showing Apple Health / Google Fit / Samsung Health flow |
| **A-4** | **World League explanation** | "Welcome to World League!" toast is meaningless | Explainer: "Compete against everyone on StepLeague!" |

### Section B: Submission Guidance — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Supported apps list on submit page** | Users don't know which apps work | Logos/names of Apple Health, Google Fit, Samsung Health, Fitbit |
| **B-2** | **Example screenshot images** | Users don't know what a valid screenshot looks like | Examples from 2-3 health apps shown |
| **B-3** | **AI verification explanation** | "AI verification" is confusing jargon | Tooltip or info text: "Our AI reads your screenshot to verify your step count" |

### Section C: Homepage Fixes — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Real numbers replace hardcoded stats** | "10K+ Steps", "50+ Leagues" are fake | Query actual counts or remove stats section for alpha |
| **C-2** | **Proof thumbnail fallback improved** | Thumbnails show "—" when images fail | Placeholder image with retry instead of dash |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Time to first submission | < 3 minutes from signup | Observe alpha tester session recording |
| Dashboard bounce rate | < 30% proceed to submit | PostHog funnel analysis |
| Screenshot guide helpfulness | Valid screenshots on first try | AI verification pass rate |
| No confusion | Zero "how do I use this?" messages | Alpha feedback review |

---

## 📅 Implementation Plan Reference

### Phase 1: Dashboard Empty State
1. Create welcome card component with personalized greeting
2. Add "Submit Your First Steps" CTA card
3. Add World League explainer
4. Show only when user has zero submissions

### Phase 2: Submission Guidance
1. Add supported apps list with logos
2. Create screenshot example component
3. Add AI verification tooltip

### Phase 3: Homepage Fixes
1. Replace hardcoded stats with real counts or hide for alpha
2. Fix proof thumbnail fallback

---

## 🔗 Related Documents

- [Alpha Readiness Audit](../../ALPHA_READINESS_AUDIT.md) — UX section
- [PRD 50: Modular Tour System](./PRD_50_Modular_Tour_System.md) — Existing tour infrastructure
- [Design System Skill](../../../.claude/skills/design-system/SKILL.md)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD from Alpha Readiness Audit |
