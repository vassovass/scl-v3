# PRD 25: Pricing & How It Works Pages

> **Order:** 25 of 34
> **Previous:** [PRD 24: Smart Engagement](./PRD_24_Smart_Engagement.md)
> **Next:** [PRD 26: User Preferences System](./PRD_26_User_Preferences.md)
> **Prioritized By:** User Request (2026-01-05) - "Fairly high priority"
> **Status:** 📋 Proposed

---

## ⚠️ Agent Instructions (MANDATORY)

1. **Read `AGENTS.md`**.
2. **Context**: This lays the groundwork for the business model.
3. **Goal**: Create public-facing "Pricing" and "How It Works" pages.

---

## Problem Statement

**Current:**
- No visual explanation of the business model.
- Users don't know why they should pay (or that they can).
- "How It Works" is minimal or hidden.

**Goal:**
- **Pricing Page**: Explain Free vs. Paid (Future) tiers.
- **How It Works**: Visual guide to StepLeague mechanics.
- **Transparency**: Clear "Privacy is a paid feature" messaging (as requested).

---

## Outcome

1.  **`/pricing` Page**:
    - **Free Tier**: Global Leaderboard access, Unlimited Steps, Public Profile.
    - **Premium / Private League** (Coming Soon): Private Leaderboards, Ghost Mode (Privacy), Advanced Stats.
2.  **`/how-it-works` Page**:
    - Step-by-step visual guide (Join -> Walk -> Sync/Submit -> Compete).
    - Explains "Global vs League" mechanics.

---

## Technical Specifications

### 1. Pricing Page Layout (`src/app/(public)/pricing/page.tsx`)

- **Hero**: "Compete for Free. Upgrade for Privacy & Power."
- **Comparison Table**:

| Feature | Free Walker | Premium / Pro |
| :--- | :---: | :---: |
| Global Leaderboard | ✅ | ✅ |
| League Access | unlimited | unlimited |
| **Privacy Mode** | ❌ (Always Public) | ✅ (Ghost Mode) |
| History Limit | 30 Days | Unlimited |
| Analytics | Basic | Advanced |
| **Cost** | **$0** | **$X/mo** |

- *Note*: Since payments aren't integrated, the "Upgrade" button can lead to a "Join Waitlist" or "Notify Me" form (Email capture).

### 2. How It Works Page (`src/app/(public)/how-it-works/page.tsx`)

- **Section 1: The Loop**
  - Icon driven: 👟 Walk daily -> 📸 Snap proof -> 🏆 Climb rank.
- **Section 2: Fair Play**
  - Explains AI verification and manual review.
- **Section 3: Leagues vs Global**
  - Explains the new dual-layer competition.

### 3. Integration with Auth

- Add links to `NavHeader` (Public Menu) and `Footer`.

---

## Implementation Steps

1.  **Create Pages**: `/pricing` and `/how-it-works` in `(public)` group.
2.  **Design**: Use new Shadcn cards and typography.
3.  **Content**: Draft copy based on "Freemium Privacy" model.
4.  **Waitlist**: Implement simple email capture for Premium interest (store in `feedback` or new table?). *Decision*: Use `feedback` table with type `waitlist_premium`.

---

## Requirements Checklist

- [ ] `/pricing` page clearly shows Privacy as a paid differentiation.
- [ ] `/how-it-works` explains the core loop.
- [ ] Responsive and theme-aware.
- [ ] "Upgrade" buttons capture interest (Waitlist).

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for Pricing & Educational pages |
