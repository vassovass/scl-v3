---
description: API route patterns, withApiHandler, auth levels, Supabase client usage
paths:
  - src/app/api/**
  - src/lib/api/**
---

# API Route Patterns

## Rule 0: Check Existing Patterns First
Before creating any new component, hook, or utility — search the codebase. We likely already have it.

## Rule 1: Mobile-First Styling
Base styles = mobile. Add `md:`, `lg:` prefixes for larger screens. Never desktop-first.

## Rule 2: Untyped Supabase Client
NEVER use `<Database>` generics. Always untyped:
```typescript
// CORRECT
const { data } = await adminClient.from("leagues").select("*");

// WRONG — never do this
const { data } = await adminClient.from<Database["public"]["Tables"]["leagues"]>("leagues").select("*");
```

## Rule 3: withApiHandler Pattern
All new API routes MUST use `withApiHandler`:

```typescript
import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";

const mySchema = z.object({ name: z.string() });

export const POST = withApiHandler({
  auth: 'required',
  schema: mySchema,
  rateLimit: { maxRequests: 5, windowMs: 60_000 },
}, async ({ user, body, adminClient }) => {
  const { data } = await adminClient.from("table").insert({
    ...body,
    user_id: user.id,
  });
  return { success: true, data };
});
```

### Auth Levels
| Level | Description |
|-------|-------------|
| `none` | Public endpoint |
| `required` | Any authenticated user |
| `superadmin` | Super admin only |
| `league_member` | Must be member of the league |
| `league_admin` | Must be admin of the league |
| `league_owner` | Must be owner of the league |

### Legacy Pattern (do NOT use for new routes)
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
```
Only exists in older routes — migrate when touching them.

## Rule 4: Suspense Boundary for useSearchParams
Any component using `useSearchParams()` MUST be wrapped in a `<Suspense>` boundary at the page level. Next.js 14 requires this for static optimization.

## Response Format
All API responses follow `{ success: boolean, data?: T, error?: string }` pattern. The `withApiHandler` wrapper enforces this automatically.

## Rate Limiting
Built into `withApiHandler` via the `rateLimit` option. Defaults vary by auth level. Always set explicit limits for public endpoints.
