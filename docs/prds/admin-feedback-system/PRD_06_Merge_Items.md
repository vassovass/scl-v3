# PRD 6: Merge Duplicate Items

> **Order:** 6 of 9  
> **Previous:** [PRD 5: Multi-Select & Bulk](./PRD_05_MultiSelect_Bulk.md)  
> **Next:** [PRD 7: Saved Views](./PRD_07_Saved_Views.md)

---

## Outcome

Admins can combine multiple related or duplicate feedback items into a single consolidated item.

---

## What is Needed

### Merge Workflow

- Select 2+ items to merge
- Choose which item becomes the "primary" (kept) item
- Other items are merged into the primary

### What Happens on Merge

- Descriptions/content from merged items are combined or appended
- The primary item remains visible
- Merged items are hidden/archived (not deleted, for audit trail)
- Merged items link back to the primary item

### AI Assistance (Nice to Have)

- AI can suggest a combined description from multiple items
- AI can help identify which items are likely duplicates

### Safety

- Show preview of result before confirming
- Merge can be undone (restore merged items)

---

## Success Criteria

- [ ] Admin can merge 2+ items into one
- [ ] Original items are preserved (archived, not deleted)
- [ ] Merged result contains relevant info from all sources
- [ ] Admin sees preview before confirming
