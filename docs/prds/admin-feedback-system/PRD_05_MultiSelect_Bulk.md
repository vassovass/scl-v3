# PRD 5: Multi-Select & Bulk Actions

> **Order:** 5 of 9  
> **Previous:** [PRD 4: Admin Feedback Page](./PRD_04_Admin_Feedback_Page.md)  
> **Next:** [PRD 6: Merge Items](./PRD_06_Merge_Items.md)

---

## Outcome

Admins can select multiple feedback items and perform actions on all of them at once.

---

## What is Needed

### Selection

- Select individual items (checkbox or similar)
- Select all visible items at once
- Clear selection
- Visual indication of selected items
- Show count of selected items

### Bulk Actions

After selecting items, admin can:

- Move all selected to a different status
- Set priority on all selected
- Mark/unmark all for public roadmap
- Archive all selected

### Efficiency

- Single action applies to all selected (not one API call per item)
- Visual feedback while action is processing
- Clear selection after successful action

---

## Success Criteria

- [ ] Admin can select multiple items
- [ ] Admin can select all visible items at once
- [ ] Bulk status change works on 50+ items
- [ ] Bulk priority change works
- [ ] Selection clears after action completes
