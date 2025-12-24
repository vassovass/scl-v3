# Internal Kanban & Public Roadmap Implementation

> **Date**: 2025-12-24  
> **Status**: In Progress  
> **Category**: Task / Checklist  
> **Relevance**: Active - current work

---

## Phase 1: Planning & Documentation
- [x] Research tools and best practices
- [x] Create decision document with rationale
- [x] Create implementation plan
- [/] Get user approval on plan

## Phase 2: Database Schema
- [x] Extend `feedback` table with `board_status`, `is_public`, `completed_at`
- [x] Create `roadmap_votes` table (1-10 priority votes)
- [x] Create `roadmap_comments` table
- [x] Create RLS policies
- [ ] Create seed script to migrate ROADMAP.md content

## Phase 3: Internal Kanban (Admin)
- [x] Create `KanbanBoard.tsx` component with drag-drop
- [x] Create `/admin/kanban` page
- [x] Add to `adminPages.ts` for menu integration
- [x] Add quick actions (mark public, edit, delete)

## Phase 4: Public Roadmap Page
- [x] Create `/roadmap` page with three sections:
  - Planned (sorted by votes)
  - In Progress
  - Completed (changelog with dates)
- [x] Create `PriorityVote.tsx` (1-10 slider)
- [ ] Create `RoadmapComments.tsx`
- [x] Add to main navigation

## Phase 5: Migration & Cleanup
- [ ] Run seed script to migrate existing ROADMAP.md items
- [ ] Delete static `ROADMAP.md` file
- [ ] Test full flow (create → vote → complete)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-24 | All phases | Refined scope with changelog integration and ROADMAP.md replacement |
| 2025-12-24 | Initial | Created task breakdown for Kanban + Roadmap implementation |
