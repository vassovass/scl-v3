# Implementation Plan: Internal Kanban & Public Roadmap

> **Date**: 2025-12-24  
> **Status**: Pending Implementation  
> **Category**: Plan / Technical  
> **Relevance**: Active - next implementation task

---

## Goal

Build an integrated task management and public roadmap system that:
1. Provides superadmins with a Kanban board for internal task tracking
2. Shows users a public roadmap with voting (1-10 priority) and comments
3. Displays completed features with dates (changelog)
4. **Replaces static ROADMAP.md** with a dynamic, database-driven system

---

## User Review Required

> [!IMPORTANT]
> **ROADMAP.md Replacement**: This plan proposes deprecating the static `ROADMAP.md` file in favor of a database-driven public roadmap page. The existing content will be migrated to the database as seed data.

---

## Proposed Changes

### Database Layer

#### [NEW] [20251224000000_extend_feedback_for_kanban.sql](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/supabase/migrations/20251224000000_extend_feedback_for_kanban.sql)

Extends the existing `feedback` table with:
- `board_status` - Kanban column (backlog, todo, in_progress, review, done)
- `is_public` - Whether to show on public roadmap
- `priority_order` - Admin ordering
- `completed_at` - When marked done (for changelog)

#### [NEW] [20251224000001_create_roadmap_tables.sql](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/supabase/migrations/20251224000001_create_roadmap_tables.sql)

Creates:
- `roadmap_votes` - User priority votes (1-10 scale, one per user per item)
- `roadmap_comments` - User comments on roadmap items
- RLS policies for authenticated users

---

### Admin Components

#### [NEW] [KanbanBoard.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/admin/KanbanBoard.tsx)

Drag-and-drop Kanban board component with:
- Columns: Backlog → Todo → In Progress → Review → Done
- Cards with title, type badge, priority
- Quick actions: mark public, edit, delete

#### [NEW] [page.tsx (admin/kanban)](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/admin/kanban/page.tsx)

Admin Kanban page, superadmin-only access.

#### [MODIFY] [adminPages.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/lib/adminPages.ts)

Add Kanban link to admin navigation.

---

### Public Roadmap Components

#### [NEW] [page.tsx (roadmap)](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/roadmap/page.tsx)

Public roadmap page with three sections:
1. **Planned** - Upcoming features, sorted by user votes
2. **In Progress** - Currently being worked on
3. **Completed** - Changelog with dates

#### [NEW] [RoadmapCard.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/roadmap/RoadmapCard.tsx)

Card component showing:
- Feature title and description
- Type badge (feature, improvement, etc.)
- Average priority rating
- Vote button (1-10 slider)
- Comment count with expand

#### [NEW] [PriorityVote.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/roadmap/PriorityVote.tsx)

1-10 priority voting component with visual feedback.

#### [NEW] [RoadmapComments.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/roadmap/RoadmapComments.tsx)

Comment section for authenticated users.

---

### API Routes

#### [NEW] [route.ts (api/roadmap)](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/roadmap/route.tsx)

GET: Fetch public roadmap items with aggregated votes.

#### [NEW] [route.ts (api/roadmap/vote)](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/roadmap/vote/route.tsx)

POST: Submit or update priority vote.

#### [NEW] [route.ts (api/roadmap/comments)](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/roadmap/comments/route.tsx)

GET/POST: Fetch and submit comments.

#### [NEW] [route.ts (api/admin/kanban)](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/admin/kanban/route.tsx)

PUT: Update card status, order, visibility (superadmin only).

---

### Navigation & Documentation

#### [MODIFY] [navigation.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/lib/navigation.ts)

Add public "Roadmap" link to main navigation.

#### [DELETE] [ROADMAP.md](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/ROADMAP.md)

Replace with database-driven system. Content migrated via seed data.

#### [NEW] [seed_roadmap.sql](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/supabase/seed_roadmap.sql)

Seed script to migrate existing ROADMAP.md content to database.

---

## Verification Plan

### Automated Tests
- Test Kanban drag-and-drop in browser
- Test voting persistence
- Test comment submission
- Verify RLS policies block unauthorized access

### Manual Verification
1. Create task in Kanban → verify appears in admin view
2. Mark task as public → verify appears on /roadmap
3. Vote on item → verify average updates
4. Add comment → verify displays for others
5. Mark task done with date → verify in "Completed" section

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-24 | Database Layer | Fixed migration filenames to use 2025 instead of 2024 |
| 2025-12-24 | Initial | Created implementation plan with all file changes |
