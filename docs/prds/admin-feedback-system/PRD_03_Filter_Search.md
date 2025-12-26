# PRD 3: Filter & Search

> **Order:** 3 of 9  
> **Previous:** [PRD 2: Admin APIs](./PRD_02_Admin_APIs.md)  
> **Next:** [PRD 4: Admin Feedback Page](./PRD_04_Admin_Feedback_Page.md)

---

## Outcome

Admins can quickly find specific feedback using filters and search.

---

## What is Needed

### Filter By

- **Type:** Bug, Feature, Improvement, Other
- **Status:** New, In Progress, Pending Review, Done
- **Priority:** Urgent, High, Medium, Low
- **Date Range:** Today, This Week, This Month, Custom dates
- **Visibility:** Show on roadmap or internal only

### Search

- Search in title/subject
- Search in description
- Results update as user types (with debounce)

### Combining Filters

- Multiple filters can be active at once
- Example: "Show me all High priority Bugs from this week"

### Usability

- Clear visual indication of active filters
- Easy way to clear all filters
- Filters should persist while navigating (URL or local state)

---

## Success Criteria

- [ ] Admin can filter by any combination of type/status/priority/date
- [ ] Admin can search by keyword
- [ ] Active filters are clearly visible
- [ ] "Clear all" resets to showing everything
