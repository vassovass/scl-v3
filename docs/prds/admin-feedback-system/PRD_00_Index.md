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

### Phase 1: Unification (Foundation for Reduced Maintenance)

| # | PRD | Outcome |
|---|-----|---------|
| 4 | [Unified API Handler](./PRD_04_Unified_API_Handler.md) | Eliminate route boilerplate |
| 5 | [Universal Data Fetching](./PRD_05_Universal_Data_Fetching.md) | Standard `useFetch` hook |
| 6 | [Badge & Color System](./PRD_06_Badge_Color_System.md) | Single source for all badges |

---

### Phase 2: Site-Wide Polish

| # | PRD | Outcome |
|---|-----|---------|
| 7 | [Navigation All Pages](./PRD_07_Navigation_All_Pages.md) | Consistent nav everywhere |
| 8 | [Homepage Swap](./PRD_08_Homepage_Swap.md) | New homepage goes live |
| 9 | [Admin Feedback Page](./PRD_09_Admin_Feedback_Page.md) | Polish existing page |

---

### Phase 3: Bulk Operations

| # | PRD | Outcome |
|---|-----|---------|
| 10 | [Bulk Actions API](./PRD_10_Bulk_Actions_API.md) | Backend for multi-select |
| 11 | [Multi-Select UI](./PRD_11_MultiSelect_UI.md) | Select and act on many items |
| 12 | [Merge Items (AI)](./PRD_12_Merge_Items.md) | AI-assisted duplicate merging |

---

### Phase 4: Advanced Features

| # | PRD | Outcome |
|---|-----|---------|
| 13 | [Saved Views](./PRD_13_Saved_Views.md) | Save filter combinations |
| 14 | [Page Layout System](./PRD_14_Page_Layout_System.md) | Reusable page templates |
| 15 | [Export Utility](./PRD_15_Export_Utility.md) | Unified export hook |

---

### Phase 5: Final Polish

| # | PRD | Outcome |
|---|-----|---------|
| 16 | [Public Roadmap Polish](./PRD_16_Public_Roadmap_Polish.md) | Visual improvements |
| 17 | [Documentation](./PRD_17_Documentation.md) | System documentation |

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
- PRDs may be done out of order if dependencies are met
- Some PRDs add value from earlier PRDs (noted in each)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Restructure | Reorganized PRDs 4+ with unification priorities |
| 2025-12-26 | Initial | Original index with PRDs 1-9 |
