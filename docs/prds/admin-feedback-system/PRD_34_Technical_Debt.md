# PRD 31: Technical Debt & Optimization

> **Order:** 31 of 31  
> **Previous:** [PRD 30: SEO Comparison](./PRD_30_SEO_Comparison.md)  
> **Status:** ⚪ Planned

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Standard patterns (e.g. `withApiHandler`, `AppError`)
   - `src/components/feedback/FeedbackWidget.tsx` - Legacy upload logic
   - `src/hooks/useAttachments.ts` - New efficient upload hook
   - `src/lib/api/handler.ts` - Standard API handler
   - `PRD_20_Expandable_Cards_Image_Paste.md` - Context on Attachments system

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

---

## Outcome

A codebase free of significant technical debt, with standardized API handling, efficient file uploads, and consistent UI component usage.

---

## Scope

### Part A: Feedback Widget Refactor
> **Goal:** Eliminate Base64 JSON uploads in favor of the optimized Attachments system.

| Task | Description |
|------|-------------|
| Refactor `FeedbackWidget` | Replace `html2canvas` Base64 export with `Blob` generation. |
| Integrate `useAttachments` | Use `useAttachments` hook to upload the screenshot Blob to Supabase Storage. |
| Update API | Modify `/api/feedback` to accept `screenshot_url` (already supported) and remove legacy Base64 handling logic. |
| Modernize UI | Rebuild the widget form using internal `shadcn/ui` components (Input, Textarea, Button). |

### Part B: API Standardization
> **Goal:** Ensure ALL API routes use the centrally managed `withApiHandler` for consistent error handling, auth, and logging.

| Task | Description |
|------|-------------|
| Audit `src/app/api` | Identify routes NOT using `withApiHandler`. |
| Migrate Routes | Refactor legacy routes to use the wrapper. |
| Remove Boilerplate | Delete repetitive `createServerSupabaseClient` / `try-catch` blocks in routes. |
| **Files to Check:** | `api/leagues`, `api/users`, `api/notifications` (example list - verify all). |

### Part C: Supabase Client Cleanup
> **Goal:** Prevent type errors and build failures by strictly using untyped clients where appropriate.

| Task | Description |
|------|-------------|
| Scan for `<Database>` | Find usages of `createServerClient<Database>` or `createClient<Database>`. |
| Remove Generics | Switch to untyped clients to avoid "never" type cascading errors. |
| Verify Builds | Ensure `npm run build` passes after changes. |

### Part D: Performance Optimization (Continuous)
> **Goal:** Ensure optimal UX by leveraging Next.js features.

| Task | Description |
|------|-------------|
| Validates Reloads | Ensure no `window.location.reload()` calls remain (replaced with `router.refresh()`). |
| Server Fetching | Optimize `AdminKanbanPage` and others to use Suspense/streaming if data fetching is slow. |

---

## Success Criteria

- [ ] `FeedbackWidget` uploads screenshots as multipart/files, not Base64.
- [ ] No direct usages of `createServerSupabaseClient` in API routes (all use `withApiHandler`).
- [ ] `npm run build` is 100% clean.
- [ ] No `window.location.reload()` calls in the codebase.

---

## Dependencies

- **Requires:** PRD 20 (Attachments System), PRD 21 (shadcn/ui).
