# PRD 36: Technical Debt & Optimization

> **Order:** 36
> **Status:** 🔄 In Progress
> **Type:** Refactor
> **Dependencies:** PRD 20 (Attachments System)
> **Blocks:** None

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/components/feedback/FeedbackWidget.tsx` | Legacy upload logic to refactor |
| `src/hooks/useAttachments.ts` | New efficient upload hook to integrate |
| `src/lib/api/handler.ts` | Standard `withApiHandler` wrapper |
| `src/app/api/` | All API routes — audit for standardization |
| `.claude/skills/api-handler/SKILL.md` | `withApiHandler` pattern reference |
| `.claude/skills/architecture-philosophy/SKILL.md` | Modular design principles |
| `.claude/skills/typescript-debugging/SKILL.md` | Type error patterns |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Verify client patterns, check for `<Database>` generic usage |
| **Playwright MCP** | E2E test feedback widget after refactor |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit all API routes for `withApiHandler` usage |
| 2 | `[READ-ONLY]` | Scan for `<Database>` generics in Supabase clients |
| 3 | `[WRITE]` | Migrate non-standard API routes to `withApiHandler` `[PARALLEL with Phase 4]` |
| 4 | `[WRITE]` | Remove `<Database>` generics from client creation `[PARALLEL with Phase 3]` |
| 5 | `[WRITE]` | Refactor FeedbackWidget to use `useAttachments` `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Remove `window.location.reload()` calls `[SEQUENTIAL]` |
| 7 | `[WRITE]` | Write Vitest + Playwright tests `[SEQUENTIAL]` |

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

## 🏗️ Detailed Feature Requirements

### Section A: FeedbackWidget Refactor — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **FeedbackWidget uses `useAttachments`** | Base64 JSON uploads are slow and large | Screenshot uploads as Blob to Supabase Storage |
| **A-2** | **Widget UI uses shadcn/ui** | Inconsistent component usage | All form elements use internal shadcn components |

### Section B: API Standardization — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **All routes use `withApiHandler`** | Inconsistent error handling | `grep -r "NextResponse.json" src/app/api` only inside handler |
| **B-2** | **No boilerplate `try-catch` blocks** | Repetitive error handling code | Each route is a clean handler function |

### Section C: Supabase Client Cleanup — 1 Item

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **No `<Database>` generics** | "never" type cascading errors | `grep -r "<Database>" src/` returns no client creation matches |

### Section D: Performance — 1 Item

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **No `window.location.reload()`** | Full page reloads kill SPA experience | `grep -r "window.location.reload" src/` returns no results |

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

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Remove legacy patterns, update API handler section
- [ ] `api-handler` skill — Confirm all examples use `withApiHandler`
- [ ] CHANGELOG.md — Log tech debt cleanup
- [ ] PRD_00_Index.md — Update PRD 36 status to ✅ Complete
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 36 — short description`

## 📚 Best Practice References

- **API standardization:** Every route should use `withApiHandler` for consistent auth, validation, and error handling.
- **Supabase clients:** Never use `<Database>` generic — causes "never" type cascading. Use untyped clients.
- **File uploads:** Always use Storage (Blob upload) not Base64 in JSON body. Max 50MB via multipart.
- **SPA navigation:** Never use `window.location.reload()`. Use `router.refresh()` or `revalidatePath()`.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for tech debt tracking |
