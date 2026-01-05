# PRD 04: Unified API Handler

> **Order:** 4 of 15  
> **Previous:** [PRD 3: Filter & Search](./PRD_03_Filter_Search.md) ✅ (Complete)  
> **Next:** [PRD 5: Universal Data Fetching](./PRD_05_Universal_Data_Fetching.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `README.md` - Project overview
   - `src/lib/api.ts` - Current API helpers
   - `src/lib/supabase/server.ts` - Supabase client patterns
   - Any route in `src/app/api/` - See current patterns being replaced

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-XX): Brief description`
   - Mark this PRD as done on the Kanban board
   - Update `AGENTS.md` if adding new patterns

---

## Outcome

A reusable API handler wrapper that eliminates repeated boilerplate across all API routes, reducing maintenance burden and ensuring consistent behavior.

---

## Problem Statement

Currently, our 29+ API routes repeat the same patterns:

```typescript
// This pattern repeats in EVERY route:
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();
    
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.message);
    
    const adminClient = createAdminClient();
    // ... actual logic ...
    return json({ data });
  } catch (error) {
    return serverError(error.message);
  }
}
```

**Issues:**

- ~15-20 lines of boilerplate per route
- Auth checks duplicated everywhere
- Error handling inconsistent
- No centralized logging

---

## What is Needed

### 1. Handler Wrapper Function

Create `src/lib/api/handler.ts` with a wrapper:

```typescript
export const withApiHandler = (config, handler) => async (request) => {
  // Handles: auth, parsing, error handling, logging
};
```

### 2. Configuration Options

The wrapper should accept:

| Option | Type | Purpose |
|--------|------|---------|
| `auth` | `'none'` \| `'required'` \| `'superadmin'` | Authentication level |
| `schema` | Zod schema | Request body validation |
| `rateLimit` | number | Optional requests/minute limit |

### 3. Handler Context

The handler function receives a context object:

```typescript
interface HandlerContext {
  user: User | null;
  body: T;  // Parsed and validated request body
  adminClient: SupabaseClient;
  request: Request;
}
```

### 4. Expected Usage

**Before (current):** ~25 lines per route  
**After (new):** ~10 lines per route

```typescript
import { withApiHandler } from '@/lib/api/handler';
import { feedbackSchema } from '@/lib/schemas/feedback';

export const POST = withApiHandler({
  auth: 'required',
  schema: feedbackSchema,
}, async ({ user, body, adminClient }) => {
  const { data } = await adminClient.from('feedback').insert({
    user_id: user.id,
    ...body,
  });
  return { success: true, data };
});
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/api/handler.ts` | CREATE - Main handler wrapper |
| `src/lib/api/index.ts` | CREATE - Re-export all API utilities |
| `src/lib/api.ts` | KEEP - Existing helpers still useful |

---

## Implementation Notes

### Do NOT break existing routes

- Existing `src/lib/api.ts` helpers (`json()`, `badRequest()`, etc.) continue to work
- New wrapper is opt-in - routes can migrate incrementally
- No changes to routes that already work

### SuperAdmin Check

Use existing pattern from `src/lib/server/superadmin.ts`:

```typescript
if (config.auth === 'superadmin') {
  const { data } = await adminClient
    .from('users')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();
  if (!data?.is_superadmin) return forbidden();
}
```

### Error Handling

- All errors return JSON with consistent format
- Log errors to console (we don't have external logging yet)
- Never expose internal error details to client

---

## Success Criteria

- [ ] `withApiHandler` wrapper created and exported
- [ ] Auth levels work: `none`, `required`, `superadmin`
- [ ] Zod schema validation works with helpful error messages
- [ ] At least 3 existing routes migrated as proof
- [ ] TypeScript types are correct (no `any` leakage)
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Rate limiting implementation (future enhancement)
- Request logging to external service
- Migrating ALL routes (just prove the pattern works)

---

## Related Files for Reference

```
src/
├── lib/
│   ├── api.ts                    # Current helpers (json, badRequest, etc.)
│   ├── supabase/server.ts        # createServerSupabaseClient, createAdminClient
│   └── server/superadmin.ts      # SuperAdmin check pattern
└── app/api/
    ├── feedback/route.ts         # Good example to study
    ├── leaderboard/route.ts      # Complex query example
    └── admin/kanban/route.ts     # SuperAdmin-only example
```

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for unified API handler |
