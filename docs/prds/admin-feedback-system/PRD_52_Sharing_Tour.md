# PRD 52: Sharing Tour (Joyride Onboarding)

> **Order:** 52
> **Status:** 📋 Proposed
> **Type:** Feature (Onboarding/UX)
> **Dependencies:** PRD 51 (Social Sharing & Stats Hub), PRD 50 (Modular Tour System)
> **Blocks:** None
> **Last Updated:** 2026-01-26

---

## 🎯 Objective

Create a guided onboarding tour that teaches users how to share their fitness achievements through the Stats Hub. The tour should follow PRD-50's modular tour system patterns and encourage users to complete their first share.

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `docs/prds/PRD_50_Modular_Tour_System.md` | Tour system architecture and patterns |
| `src/components/providers/TourProvider.tsx` | Tour provider implementation |
| `src/lib/tours/TourRegistry.ts` | Tour registration patterns |
| `.agent/skills/social-sharing/SKILL.md` | Sharing feature patterns |

---

## 🏗️ Detailed Feature Requirements

### Section A: Tour Configuration — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Tour ID: `sharing-guide`** | Unique identifier | Registered in TourRegistry |
| **A-2** | **Auto-trigger on first Stats Hub visit** | Discovery | Tour starts automatically for new users |
| **A-3** | **Skip option always visible** | User control | "Skip Tour" button on every step |
| **A-4** | **Tour progress persistence** | Resume capability | Progress saved in user_tour_progress |
| **A-5** | **Mobile-responsive steps** | Mobile users | Character limits per PRD-50 (60 header, 130 body) |

### Section B: Tour Steps — 7 Items

| # | Step | Target | Content | Interactive? |
|---|------|--------|---------|--------------|
| **B-1** | **Welcome** | Stats Hub container | "Welcome to your Stats Hub! Here you can view and share all your achievements." | No |
| **B-2** | **Stats Cards** | First stat card | "Each card shows a different achievement. Tap any card to see more details." | No |
| **B-3** | **Period Selector** | Period dropdown | "Choose your timeframe - share today's steps or your whole week." | No |
| **B-4** | **Share Button** | Share button on card | "Tap 'Share' to create a beautiful card for WhatsApp or social media." | **Yes - spotlightClicks** |
| **B-5** | **Share Modal Preview** | Card preview area | "This preview shows exactly what your shared card will look like." | No |
| **B-6** | **WhatsApp Button** | WhatsApp share button | "WhatsApp is the quickest way to share with your fitness group!" | No |
| **B-7** | **Completion** | Modal | "You're all set! Share your achievements anytime from the Stats Hub. 🎉" | No |

### Section C: Analytics & Testing — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Tour analytics events** | Track effectiveness | `tour_started`, `tour_step_viewed`, `tour_completed`, `tour_skipped` |
| **C-2** | **A/B test variants** | Optimize conversion | Test "Quick" (4 steps) vs "Detailed" (7 steps) |
| **C-3** | **Drop-off tracking** | Identify friction | Track which step users abandon |
| **C-4** | **Share conversion tracking** | Measure success | Track if user shares within tour session |

---

## ✅ Success Criteria

| Metric | Target | Verification |
|--------|--------|--------------|
| Tour completion rate | 60%+ | PostHog funnel |
| Share during/after tour | 30%+ of tour completers | Analytics |
| Tour loads on first Stats Hub visit | 100% for new users | E2E test |
| Mobile step readability | All text within limits | Manual review |

---

## 📅 Implementation Plan Reference

1. Register `sharing-guide` tour in TourRegistry
2. Create tour steps definition with targets
3. Add data-tour attributes to Stats Hub elements
4. Implement interactive share button step
5. Add analytics tracking
6. Set up A/B test in PostHog

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-26 | Initial | Created sharing tour PRD |
