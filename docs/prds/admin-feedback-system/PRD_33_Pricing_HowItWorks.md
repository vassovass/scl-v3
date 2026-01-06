# PRD 33: Pricing & How It Works Pages

> **Order:** 33 of 36
> **Previous:** [PRD 32: Admin Analytics](./PRD_32_Admin_Analytics.md)
> **Next:** [PRD 34: B2B Landing Pages](./PRD_34_B2B_Landing.md)
> **Status:** 📋 Proposed
> **Phase:** Product Hunt Stage

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

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Frontend Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Pricing page loads | `/pricing` | Pricing table visible |
| Pricing responsiveness | Mobile | Table stacks or scrolls |
| Waitlist button | `/pricing` -> "Notify Me" | Opens waitlist modal/page |
| How it works loads | `/how-it-works` | Visual steps visible |
| Nav links | Header/Footer | Links present and working |

### Code Checks

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Metadata present | View Source | Title/Description tags correct |
| Build passes | `npm run build` | No errors |

### Documentation Checks

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated

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
