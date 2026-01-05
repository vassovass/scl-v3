# PRD 08: Homepage Swap

> **Order:** 8 of 17  
> **Previous:** [PRD 7: Navigation Across All Pages](./PRD_07_Navigation_All_Pages.md)  
> **Next:** [PRD 9: Admin Feedback Page Polish](./PRD_09_Admin_Feedback_Page.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/page.tsx` - Current homepage
   - `src/app/home-preview/page.tsx` - New homepage to promote

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

The new homepage design (currently at `/home-preview`) becomes the main homepage at `/`, and the old homepage is removed.

---

## What is Needed

### 1. Swap the Pages

- Take content from `src/app/home-preview/page.tsx`
- Replace `src/app/page.tsx` with it
- Delete `src/app/home-preview/` folder

### 2. Verify Functionality

After swap, ensure:

- Homepage loads at `/`
- All links/buttons work
- Mobile layout works
- Dark/light mode works (if applicable)

### 3. Clean Up References

Search for any references to `/home-preview` and remove them:

- Links in navigation
- Test files
- Documentation

---

## Files to Modify

| File | Action |
|------|--------|
| `src/app/page.tsx` | REPLACE with home-preview content |
| `src/app/home-preview/page.tsx` | DELETE after migration |
| `src/app/home-preview/` | DELETE directory |

---

## Success Criteria

- [ ] Homepage at `/` shows new design
- [ ] `/home-preview` route no longer exists
- [ ] All homepage links work
- [ ] Mobile responsive
- [ ] No broken references to old pages
- [ ] Build passes (`npm run build`)

---

## Risk: Low

This is a simple file swap with no backend changes.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for homepage swap |
