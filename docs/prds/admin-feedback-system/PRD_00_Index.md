# Admin Feedback & Roadmap System - PRD Index

> **Purpose:** Re-implement the admin feedback management system that was reverted.
>
> These PRDs describe WHAT is needed, not HOW to implement. The implementing agent decides the best approach.

---

## Implementation Order

| # | PRD | Outcome Summary |
|---|-----|-----------------|
| 1 | [Database Schema](./PRD_01_Database_Schema.md) | Timestamps and indexes on feedback table |
| 2 | [Admin Feedback APIs](./PRD_02_Admin_APIs.md) | Backend endpoints for feedback management |
| 3 | [Filter & Search](./PRD_03_Filter_Search.md) | Ability to filter and search feedback |
| 4 | [Admin Feedback Page](./PRD_04_Admin_Feedback_Page.md) | Central page for managing user feedback |
| 5 | [Multi-Select & Bulk Actions](./PRD_05_MultiSelect_Bulk.md) | Select multiple items, act on them together |
| 6 | [Merge Duplicate Items](./PRD_06_Merge_Items.md) | Combine duplicate/related feedback into one |
| 7 | [Saved Views](./PRD_07_Saved_Views.md) | Save and restore filter configurations |
| 8 | [Public Roadmap Enhancements](./PRD_08_Public_Roadmap.md) | Enhanced public roadmap display |
| 9 | [Documentation](./PRD_09_Documentation.md) | System documentation and diagrams |

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

- Each PRD may reference others when there are dependencies
- PRDs should be completed in order (1→9)
- Earlier PRDs create foundations that later PRDs build upon
