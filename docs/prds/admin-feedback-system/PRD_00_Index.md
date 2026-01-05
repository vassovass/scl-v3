# Admin Feedback & Roadmap System - PRD Index

> **Purpose:** Re-implement and enhance the admin feedback management system.
>
> These PRDs describe WHAT is needed, not HOW to implement. The implementing agent decides the best approach.

---

## ⚠️ Agent Instructions (MANDATORY)

**Before starting ANY PRD, the implementing agent MUST:**

1. Read `AGENTS.md` for critical rules and documentation requirements
2. Read `README.md` for project overview
3. Check completed PRDs for context
4. Follow all documentation update rules

---

## Implementation Order

### Phase 0: Foundation (Complete ✅)

| # | PRD | Status |
|---|-----|--------|
| 1 | [Database Schema](./PRD_01_Database_Schema.md) | ✅ Complete |
| 2 | [Admin Feedback APIs](./PRD_02_Admin_APIs.md) | ✅ Complete |
| 3 | [Filter & Search](./PRD_03_Filter_Search.md) | ✅ Complete |

---

### Phase 1: Unification (Complete ✅)

| # | PRD | Status |
|---|-----|--------|
| 4 | [Unified API Handler](./PRD_04_Unified_API_Handler.md) | ✅ Complete |
| 5 | [Universal Data Fetching](./PRD_05_Universal_Data_Fetching.md) | ✅ Complete |
| 6 | [Badge & Color System](./PRD_06_Badge_Color_System.md) | ✅ Complete |

---

### Phase 2: Site-Wide Polish (Complete ✅)

| # | PRD | Status |
|---|-----|--------|
| 7 | [Navigation All Pages](./PRD_07_Navigation_All_Pages.md) | ✅ Complete |
| 8 | [Homepage Swap](./PRD_08_Homepage_Swap.md) | ✅ Complete |
| 9 | [Admin Feedback Page](./PRD_09_Admin_Feedback_Page.md) | ✅ Complete |

---

### Phase 3: Bulk Operations (Complete ✅)

| # | PRD | Status |
|---|-----|--------|
| 10 | [Bulk Actions API](./PRD_10_Bulk_Actions_API.md) | ✅ Complete |
| 11 | [Multi-Select UI](./PRD_11_MultiSelect_UI.md) | ✅ Complete |
| 12 | [Merge Items (AI)](./PRD_12_Merge_Items.md) | ✅ Complete |
| 13 | [Saved Views](./PRD_13_Saved_Views.md) | ✅ Complete |

---

### Phase 4: Alpha Testing Infrastructure (Complete ✅)

| # | PRD | Status |
|---|-----|--------|
| 14 | [Analytics GTM & GA4](./PRD_14_Analytics_GTM_GA4.md) | ✅ Complete |
| 15 | [Page Layout System](./PRD_15_Page_Layout_System.md) | ✅ Complete |

---

### Phase 5: Advanced Features

| # | PRD | Status |
|---|-----|--------|
| 16 | [Import/Export System](./PRD_16_Export_Utility.md) | ✅ Complete |
| 17 | [Public Roadmap Polish](./PRD_17_Public_Roadmap_Polish.md) | ✅ Complete |
| 18 | [Documentation](./PRD_18_Documentation.md) | ✅ Complete |

---

### Phase 6: Core League Features

| # | PRD | Status |
|---|-----|--------|
| 19 | [League Start Date](./PRD_19_League_Start_Date.md) | ✅ Complete |

---

### Phase 7: Enhanced Card Experience

| # | PRD | Status |
|---|-----|--------|
| 20 | [Expandable Cards with Image Paste](./PRD_20_Expandable_Cards_Image_Paste.md) | 🔄 In Progress |

---

### Phase 8: UI Component Library

| # | PRD | Outcome |
|---|-----|---------|
| 21 | [shadcn/ui Integration](./PRD_21_shadcn_Integration.md) | Toast notifications, dialogs, theme toggle, accessible dropdowns |

---

### Phase 9: Settings & Configuration

> **Build these first** - they are dependencies for later PRDs.

| # | PRD | Outcome |
|---|-----|---------|
| 22 | [User Preferences System](./PRD_22_User_Preferences.md) | Modular settings architecture |
| 23 | [SuperAdmin Settings](./PRD_23_SuperAdmin_Settings.md) | App-wide config, feature flags, visibility controls |

---

### Phase 10: UX Flow Improvements

| # | PRD | Outcome |
|---|-----|---------|
| 24 | [League Hub Redesign](./PRD_24_League_Hub.md) | Click league → Hub overview (not submit form) |
| 25 | [Smart Step Reminder](./PRD_25_Step_Reminder.md) | Floating dismissible CTA + streak freeze |
| 26 | [Unified Progress View](./PRD_26_Unified_Progress.md) | My Progress / League Progress toggle |

---

### Phase 11: Social & Analytics

| # | PRD | Outcome |
|---|-----|---------|
| 27 | [Social Encouragement](./PRD_27_Social_Encouragement.md) | High-fives, cheer prompts, encouragement |
| 28 | [Admin Analytics](./PRD_28_Admin_Analytics.md) | KPI dashboard, charts, CSV/PDF export |

---

### Phase 12: Marketing & Growth

| # | PRD | Outcome |
|---|-----|---------|
| 29 | [B2B Landing Pages](./PRD_29_B2B_Landing.md) | /teams landing, waitlist, features |
| 30 | [SEO Comparison Pages](./PRD_30_SEO_Comparison.md) | /compare hub, competitor comparisons |

---

## Cross-PRD Checklist

> **Every PRD must verify these before marking complete:**

### Theme Awareness
- [ ] Uses CSS variables (`--background`, `--foreground`, etc.)
- [ ] Works in both light and dark modes
- [ ] No hardcoded colors
- [ ] Tested with theme toggle

### shadcn Usage
- [ ] Uses shadcn components where applicable
- [ ] Toast for user feedback
- [ ] Dialog for confirmations

### Settings Integration
- [ ] Respects feature flags (PRD 23)
- [ ] Reads user preferences (PRD 22)

### Documentation
- [ ] CHANGELOG.md updated
- [ ] ROADMAP.md updated if completing a roadmap item

---

## Scope Clarification

**User Feedback** = Items submitted by users through:

- The `/feedback` page
- The floating 💬 feedback widget
- Module feedback (thumbs up/down on UI components)

**Roadmap Items** = User feedback that admins promote to be visible on the public `/roadmap` page.

**This is NOT for:** Developer-created internal tasks or to-do lists.

---

## Cross-References

- Each PRD links to its previous and next PRD
- PRDs are numbered in build order (21 → 30)
- Dependencies noted in each PRD header

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Renumbering | Renumbered PRDs 22-28 to match build order |
| 2026-01-05 | Cross-PRD Checklist | Added theme awareness, shadcn, settings verification |
| 2026-01-05 | Phase 10-12 | Added PRDs 27-30 (Social, Analytics, B2B, SEO) |
| 2026-01-05 | Phase 9 | Added PRDs 22-23 (User Preferences, SuperAdmin Settings) |
| 2026-01-05 | PRD 21 | Added Part G: Theme Toggle UI (Light/Dark mode) |
| 2026-01-05 | PRD 25 | Added Streak Freeze System (Duolingo model) |
| 2026-01-04 | Phase 8 | Added PRD 21: shadcn/ui Integration |
| 2025-12-30 | Phase 4 | Added PRD 14: Analytics GTM & GA4 |
| 2025-12-28 | Phase 7 | Added PRD 19: Expandable Cards with Image Paste |
| 2025-12-26 | Restructure | Reorganized PRDs 4+ with unification priorities |
| 2025-12-26 | Initial | Original index with PRDs 1-9 |
