# PRD 60: UX Onboarding — First 5 Minutes

> **Order:** 60
> **Status:** 🟡 Planning
> **Type:** Feature
> **Priority:** HIGH — Critical for alpha retention
> **Source:** Alpha Readiness Audit (UX section + New User Journey)

## 🎯 Objective

Reduce the "time to aha moment" from 5-10 minutes to 2-3 minutes. Currently, after signup, users see a near-empty dashboard with two lines of text, no guidance on how to submit steps, and no context for what the World League means. This is the #1 reason alpha testers will drop off.

**Current journey:** Sign up → Empty dashboard → "What do I do now?" → Leave

**Target journey:** Sign up → Guided dashboard → Submit first steps → See leaderboard → "This is fun!"

## ⚠️ Agent Context (Mandatory)

Study these files before implementing:
- `src/app/(dashboard)/dashboard/page.tsx` — Current dashboard (improve empty state)
- `src/app/(dashboard)/submit-steps/page.tsx` — Step submission page
- `src/components/tours/` — Existing tour system (7 modular tours already built)
- `src/app/(public)/page.tsx` — Homepage (hardcoded stats to fix)
- `src/app/api/auth/callback/route.ts` — Post-signup flow (World League auto-enroll)

## 🏗️ Detailed Feature Requirements

### Section A: Dashboard Empty State — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Welcome card with name and next step** | Users see empty dashboard after signup | Personalized "Welcome, {name}! Here's how to get started" card |
| **A-2** | **"Submit Your First Steps" CTA** | Users don't know where to submit | Prominent button/card linking to submit-steps with brief explanation |
| **A-3** | **"How to take a screenshot" guide** | Users don't know what screenshot to take | Visual guide showing Apple Health / Google Fit / Samsung Health screenshot flow |
| **A-4** | **World League explanation** | "Welcome to World League!" toast means nothing | Brief explainer card: "You're in the World League — compete against everyone on StepLeague!" |

### Section B: Submission Guidance — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Supported apps list on submit page** | Users don't know which apps work | Show logos/names of Apple Health, Google Fit, Samsung Health, Fitbit |
| **B-2** | **Screenshot example images** | Users don't know what a valid screenshot looks like | Show example screenshots from 2-3 health apps |
| **B-3** | **AI verification explanation** | "AI verification" is confusing | Brief tooltip or info text: "Our AI reads your screenshot to verify your step count" |

### Section C: Homepage Fixes — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Replace hardcoded stats with real numbers** | "10K+ Steps Tracked", "50+ Active Leagues" are fake | Query actual counts from database, or remove stats section for alpha |
| **C-2** | **Add proof thumbnails fallback** | Proof thumbnails show "—" when images fail | Show placeholder image with retry option instead of dash |

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Time to first submission | < 3 minutes from signup | Observe alpha tester session |
| Dashboard bounce rate | < 30% (users navigate to submit) | PostHog funnel analysis |
| Screenshot guide helpfulness | Users submit valid screenshots on first try | Review AI verification pass rate |
| No confusion messages | Zero "how do I use this?" messages from testers | Alpha feedback review |

## 📅 Implementation Plan Reference

### Phase 1: Dashboard Empty State (2-3 hours)
1. Create welcome card component with personalized greeting
2. Add "Submit Your First Steps" CTA card
3. Add World League explainer card
4. Show these only when user has zero submissions

### Phase 2: Submission Guidance (2 hours)
1. Add supported apps list with logos
2. Create screenshot example component
3. Add AI verification tooltip

### Phase 3: Homepage Fixes (1 hour)
1. Replace hardcoded stats with real counts or hide for alpha
2. Fix proof thumbnail fallback

## 🔗 Related Documents
- [Alpha Readiness Audit](../ALPHA_READINESS_AUDIT.md) — UX section
- [Tour System PRD](./admin-feedback-system/PRD_50_Modular_Tour_System.md) — Existing tour infrastructure

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | All | Initial PRD created from Alpha Readiness Audit |
