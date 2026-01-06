# PRD 36: Technical Debt & Optimization

> **Order:** 36 of 36
> **Previous:** [PRD 35: SEO Comparison Pages](./PRD_35_SEO_Comparison.md)
> **Status:** ⚪ Planned
> **Phase:** Maintenance

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
| Update API | Modify `/api/feedback` to remove legacy Base64 handling logic. |
| Modernize UI | Rebuild the widget form using internal `shadcn/ui` components. |

### Part B: API Standardization
> **Goal:** Ensure ALL API routes use the centrally managed `withApiHandler` for consistent error handling.

| Task | Description |
|------|-------------|
| Audit `src/app/api` | Identify routes NOT using `withApiHandler`. |
| Migrate Routes | Refactor legacy routes to use the wrapper. |
| Remove Boilerplate | Delete repetitive `createServerSupabaseClient` / `try-catch` blocks. |

### Part C: Supabase Client Cleanup
> **Goal:** Prevent type errors and build failures by strictly using untyped clients where appropriate.

| Task | Description |
|------|-------------|
| Scan for `<Database>` | Find usages of `createServerClient<Database>` or `createClient<Database>`. |
| Remove Generics | Switch to untyped clients to avoid "never" type cascading errors. |

### Part D: Performance Optimization
> **Goal:** Ensure optimal UX by leveraging Next.js features.

| Task | Description |
|------|-------------|
| Validates Reloads | Ensure no `window.location.reload()` calls remain. |
| Server Fetching | Optimize `AdminKanbanPage` etc. to use Suspense/streaming. |

---

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Code Checks

| Check | Command | Expected Result |
|-------|---------|-----------------|
| API Handler Audit | `grep -r "NextResponse.json" src/app/api` | Should only find usages inside `withApiHandler` or very specific edge cases |
| Database Types | `grep -r "<Database>" src/utils` | Should return no results for client creation |
| Reload Audit | `grep -r "window.location.reload" src` | Should return no results |
| Build Check | `npm run build` | Builds successfully without type errors |

### Functionality Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Feedback Upload | Feedback Widget | Screenshot uploads as file, no Base64 in payload |
| API Error | Trigger 500 in dev | Returns standard JSON error format |

### Documentation Checks

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated (removed legacy patterns)

---

## Dependencies

- **Requires:** PRD 20 (Attachments System), PRD 21 (shadcn/ui).

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for tech debt tracking |
