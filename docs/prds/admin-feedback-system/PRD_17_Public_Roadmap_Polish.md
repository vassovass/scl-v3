# PRD 17: Public Roadmap Polish

> **Order:** 17 of 20  
> **Previous:** [PRD 16: Export Utility](./PRD_16_Export_Utility.md)  
> **Next:** [PRD 18: Documentation](./PRD_18_Documentation.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/components/roadmap/RoadmapView.tsx` - Main roadmap component
   - `src/components/roadmap/RoadmapCard.tsx` - Card component
   - `src/components/roadmap/PriorityVote.tsx` - Voting component
   - `src/app/roadmap/page.tsx` - Roadmap page

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-XX): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Outcome

The public roadmap page is polished and provides an excellent user experience showing planned, in-progress, and completed features.

---

## Current State

The roadmap page **already exists** with:

- ✅ Column layout (Now, Next, Later, Done)
- ✅ Item cards with type badges
- ✅ Agent work indicator (blue glow)
- ✅ CSV export
- ✅ Voting system

---

## What is Needed (Polish Only)

### 1. Visual Improvements

- Ensure consistent styling with design system
- Better visual hierarchy between columns
- Improved mobile responsiveness
- Use Badge component from PRD 06 (if complete)

### 2. Agent Work Indicator

Currently items being worked on have a blue glow. Ensure:

- ✅ Obviously visible
- ✅ Has subtle animation (pulse)
- ✅ Shows "Building Now" label

### 3. Export Improvements

- Use Export Utility from PRD 15 (if complete)
- Button clearly visible
- Include appropriate columns

### 4. Performance

- Lazy load items if list grows long
- Optimize re-renders

### 5. Navigation

- Ensure NavHeader is present (PRD 07)
- Back to dashboard link

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/roadmap/RoadmapView.tsx` | POLISH - Visual improvements |
| `src/components/roadmap/RoadmapCard.tsx` | POLISH - Use Badge component |
| `src/app/roadmap/page.tsx` | VERIFY - Has navigation |

---

## Success Criteria

- [ ] Roadmap displays all columns correctly
- [ ] Agent work items have visible glow/indicator
- [ ] Voting works for logged-in users
- [ ] Export works
- [ ] Mobile layout is usable
- [ ] Page has navigation header
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- User comments on items
- Sharing individual items
- Notification when item status changes

---

## Related PRDs

- **Uses if available:** PRD 06 (Badge System), PRD 15 (Export Utility)
- **Requires:** PRD 07 (Navigation)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for roadmap polish |
