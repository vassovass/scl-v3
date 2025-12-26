# PRD 4: Admin Feedback Page

> **Order:** 4 of 9  
> **Previous:** [PRD 3: Filter & Search](./PRD_03_Filter_Search.md)  
> **Next:** [PRD 5: Multi-Select & Bulk](./PRD_05_MultiSelect_Bulk.md)

---

## Outcome

A dedicated admin page where SuperAdmins can view and manage all user-submitted feedback.

---

## What is Needed

### View All Feedback

- See all feedback submitted by users
- Each item shows: type, title, description preview, who submitted it, when
- Easy to scan and understand at a glance

### View Modes

- **List View:** Traditional list, good for detailed scanning
- **Kanban View:** Columns by status (New, In Progress, Done, etc.)
- User can switch between views

### Quick Actions

- Change status without leaving the page
- Change priority without leaving the page
- Mark item to show on public roadmap

### Visual Clarity

- High priority items stand out visually
- Different types (bug vs feature) are distinguishable
- New/unread items are highlighted

### Access Control

- Page only accessible to SuperAdmins
- Non-SuperAdmins are redirected away

---

## Success Criteria

- [ ] SuperAdmin can see all user feedback in one place
- [ ] SuperAdmin can toggle between list and kanban views
- [ ] SuperAdmin can change item status/priority inline
- [ ] High priority and new items are visually prominent
- [ ] Page loads in under 2 seconds
