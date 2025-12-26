# PRD 2: Admin Feedback APIs

> **Order:** 2 of 9  
> **Previous:** [PRD 1: Database Schema](./PRD_01_Database_Schema.md)  
> **Next:** [PRD 3: Filter & Search](./PRD_03_Filter_Search.md)

---

## Outcome

Backend APIs that allow SuperAdmins to manage user-submitted feedback.

---

## What is Needed

### Read Operations

- Fetch all user feedback with pagination
- Fetch feedback filtered by type, status, priority, date
- Fetch a single feedback item by ID

### Update Operations  

- Update a single item's status (new → in progress → done)
- Update a single item's priority
- Update whether an item appears on the public roadmap

### Bulk Operations

- Update multiple items at once (status, priority, etc.)
- Move multiple items to a different status in one action

### Authorization

- Only SuperAdmins can access these APIs
- Regular users and guests are rejected

---

## Success Criteria

- [ ] SuperAdmin can fetch filtered feedback list
- [ ] SuperAdmin can update item status/priority
- [ ] SuperAdmin can update 50+ items in one request
- [ ] Non-SuperAdmins get access denied
