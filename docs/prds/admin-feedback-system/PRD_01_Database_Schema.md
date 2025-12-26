# PRD 1: Database Schema Updates

> **Order:** 1 of 9 — Must be done first  
> **Next:** [PRD 2: Admin APIs](./PRD_02_Admin_APIs.md)

---

## Outcome

The `feedback` table needs additional columns to track when items change over time.

---

## What is Needed

### Automatic Timestamps

- Track when any feedback item was last modified
- Track when an item's status was changed
- Track when an item was marked as completed

### Efficient Queries

- Fast queries when filtering by date range
- Fast queries when filtering by status + type combinations
- Fast queries for "recently updated" items

### Backward Compatibility

- Existing feedback items must continue to work
- New columns should have sensible defaults

---

## Success Criteria

- [ ] Admins can sort feedback by "last updated"
- [ ] Admins can filter by "updated this week"
- [ ] System automatically tracks status change times
- [ ] Queries remain fast with 1000+ feedback items
