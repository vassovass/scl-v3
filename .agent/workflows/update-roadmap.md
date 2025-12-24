---
description: Update roadmap when starting/completing work on features
---

# Update Roadmap Workflow

Call this API when starting or completing work on roadmap items.

## When Starting Work

Call POST `/api/agent/current-work` with either:

### Existing Item (has feedback_id in database)

```bash
curl -X POST https://scl-v3.vercel.app/api/agent/current-work \
  -H "Content-Type: application/json" \
  -d '{"feedback_id": "uuid-of-existing-item"}'
```

### New Item (creating fresh)

```bash
curl -X POST https://scl-v3.vercel.app/api/agent/current-work \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Feature Name",
    "description": "What you are building",
    "type": "feature"
  }'
```

This will:

1. Clear any previous active agent work
2. Mark this item as `is_agent_working = true` and `completion_status = in_progress`
3. Show it at the top of the "Now" column on `/roadmap` with a blue "Building Now" badge

## When Coding is Complete

Call PATCH to mark as pending_review (awaiting superadmin verification):

```bash
curl -X PATCH https://scl-v3.vercel.app/api/agent/current-work \
  -H "Content-Type: application/json" \
  -d '{"feedback_id": "uuid-of-item", "action": "pending_review"}'
```

This will:

1. Clear the `is_agent_working` flag
2. Set `completion_status = pending_review`
3. Show amber "Awaiting Review" badge on `/roadmap`
4. Notify superadmin (they mark as verified → done)

## Auto-Stale

Items marked as `is_agent_working` are automatically cleared after 24 hours.
