# PRD 7: Saved Views

> **Order:** 7 of 9  
> **Previous:** [PRD 6: Merge Items](./PRD_06_Merge_Items.md)  
> **Next:** [PRD 8: Public Roadmap](./PRD_08_Public_Roadmap.md)

---

## Outcome

Admins can save their commonly-used filter combinations and restore them quickly.

---

## What is Needed

### Save Current View

- After setting filters, admin can save the current configuration
- Give the view a name (e.g., "Urgent Bugs", "This Week's Features")
- Saved views persist across sessions

### Restore Saved View

- Quick access to previously saved views
- One click to apply a saved view's filters

### Example Views

- "Urgent Items" - Priority = Urgent
- "New This Week" - Status = New, Date = Last 7 days
- "Bugs to Triage" - Type = Bug, Status = New
- "Roadmap Items" - Show on Roadmap = true

### Management

- Delete saved views that are no longer needed
- Rename saved views

---

## Success Criteria

- [ ] Admin can save current filter state as a named view
- [ ] Admin can restore a saved view with one click
- [ ] Saved views persist after browser refresh
- [ ] Admin can delete unused views
