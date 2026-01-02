# Feedback & Roadmap System Documentation

> **Last Updated:** 2026-01-03  
> **Status:** Production

## System Overview

The **Feedback & Roadmap System** is a comprehensive loop that allows users to submit feedback, admins to triage it, and the community to vote on the public roadmap. It connects user needs directly to the development cycle.

### Key Flows

1.  **Submission**: Users submit feedback via the floating widget or comprehensive feedback page.
2.  **Triage**: Admins review feedback in the Admin Dashboard (`/admin/feedback`), converting valid items into Kanban cards.
3.  **Development**: Features are tracked on the internal Kanban board (`/admin/kanban`).
4.  **Public Roadmap**: Selected features are displayed on the public roadmap (`/roadmap`) for transparency and user voting.
5.  **Completion**: Finished features are marked as done, notifying users and appearing in the changelog.

---

## Architecture

See the [detailed flow diagram](./diagrams/feedback-flow.md) for a visual representation.

The system is built on Supabase for data storage and Next.js for the frontend/API.

### Database Schema

-   **`feedback`**: Raw user submissions (bugs, feature requests, general).
-   **`module_feedback`**: Context-specific feedback linked to specific UI modules.
-   **`kanban_items`**: Admin-managed work items (often linked to feedback).
-   **`roadmap_votes`**: User votes on public roadmap items.

---

## Component Reference

| Component | File Path | Purpose |
| :--- | :--- | :--- |
| **UniversalFilters** | `src/components/shared/UniversalFilters.tsx` | Reusable filter bar for lists (Feedback, Kanban, users). |
| **FeedbackList** | `src/components/admin/FeedbackList.tsx` | Admin view for triaging incoming feedback. |
| **KanbanBoard** | `src/components/admin/KanbanBoard.tsx` | Internal project management board with drag-and-drop. |
| **RoadmapView** | `src/components/roadmap/RoadmapView.tsx` | Public-facing roadmap with "Now", "Next", "Later", "Done" columns. |
| **FeedbackWidget** | `src/components/feedback/FeedbackWidget.tsx` | Floating action button for quick user feedback. |
| **VoteButton** | `src/components/roadmap/VoteButton.tsx` | Handles optimistic UI updates for roadmap voting. |

---

## API Reference

All APIs use the specialized `withApiHandler` wrapper for consistent error handling and auth.

| Endpoint | Method | Auth Level | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/feedback` | `POST` | `required` | Submit new feedback with optional screenshot. |
| `/api/admin/kanban` | `GET` | `superadmin` | Fetch all board items. |
| `/api/admin/kanban` | `PUT` | `superadmin` | Update item status/position (drag-and-drop). |
| `/api/admin/feedback/bulk` | `PATCH` | `superadmin` | Bulk archive/delete/status updates. |
| `/api/roadmap/vote` | `POST` | `required` | Toggle user vote on a roadmap item. |
| `/api/admin/feedback/import`| `POST` | `superadmin` | Import items from JSON/CSV. |

---

## Related Documentation

-   [PRD 02: Admin APIs](./prds/admin-feedback-system/PRD_02_Admin_APIs.md)
-   [PRD 09: Admin Feedback Page](./prds/admin-feedback-system/PRD_09_Admin_Feedback_Page.md)
-   [PRD 17: Public Roadmap Polish](./prds/admin-feedback-system/PRD_17_Public_Roadmap_Polish.md)
