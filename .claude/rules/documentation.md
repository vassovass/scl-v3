---
description: Documentation update requirements, sync checklist, and cross-reference map for keeping context files current
paths:
  - CHANGELOG.md
  - ROADMAP.md
  - README.md
  - docs/**
  - AGENTS.md
---

# Documentation Update Rules

## On Every Commit (MANDATORY)

1. **CHANGELOG.md** — Add entry with date (YYYY-MM-DD), category (Added/Changed/Fixed/Removed), description
2. **ROADMAP.md** — Move completed items to "Done", update "In Progress" if applicable
3. **Design System Page** (`/admin/design-system`) — Update when adding UI components, design tokens, or branding changes

## UI/Styling Change Checklist

When making ANY UI, branding, or component changes:

- [ ] Use CSS variables from `globals.css` — never hardcoded colors
- [ ] Add BOTH `:root` (dark) AND `[data-theme="light"]` variants for new tokens
- [ ] Test both light and dark mode
- [ ] Update design system page with live examples for new components
- [ ] New admin pages: add entry to `src/lib/adminPages.ts` (menu auto-updates)

## Modularization Rule

If the same UI pattern is used 3+ times, extract it into `src/components/ui/`. Add to Component Library in design system page.

## Roadmap Updates (Programmatic)

```typescript
// Set current work
POST /api/agent/current-work
{ "task": "PRD 42 — test coverage", "status": "in_progress" }

// Clear when done
DELETE /api/agent/current-work

// Mark kanban item done
PUT /api/admin/kanban
{ "id": "prd-42", "column": "Done" }
```

**Roadmap columns**: Now → Next → Later → Future

## Artifact Storage

All AI-generated planning documents go in `docs/artifacts/`:
- Naming: `decisions_[topic].md`, `plan_[feature].md`
- Must include changelog table at end (Date | Section | Change)
- Must be committed to git

## Context Sync Cross-Reference

When you modify a pattern, update its documentation in ALL locations:

| Pattern | Rule File | Skill | Doc |
|---------|-----------|-------|-----|
| API routes / withApiHandler | rules/api-patterns.md | api-handler | — |
| Error handling / AppError | rules/architecture.md | error-handling | — |
| Auth / deadlocks / PKCE | rules/supabase-auth.md | auth-patterns | — |
| Theme / CSS variables / contrast | rules/ui-components.md | design-system | docs/THEME_SYSTEM.md |
| Forms / FormInput | rules/ui-components.md | form-components | docs/FORM_SYSTEM.md |
| Analytics / GTM / PostHog | rules/analytics.md | analytics-tracking | docs/MCP_SERVERS.md |
| Offline / PWA / caching | rules/architecture.md | — | — |
| Proxy / Act As | rules/architecture.md | — | — |
| Middleware / redirects | — | middleware-patterns | — |
| Database schema | — | supabase-patterns | docs/DATABASE_SCHEMA.md |
| Changelog / roadmap / kanban | rules/documentation.md | project-updates | — |
| Convention-first protocol | — | architecture-philosophy | AGENTS.md |
| Layered contrast | rules/ui-components.md | design-system | docs/THEME_SYSTEM.md |
| PRD creation / index | rules/prds.md | prd-creation | docs/prds/admin-feedback-system/PRD_00_Index.md |
| Database migrations | rules/migrations.md | supabase-patterns | docs/DATABASE_SCHEMA.md |
| Hooks / render loops | rules/hooks.md | react-debugging | — |
| Skill creation / update | rules/skills.md | skill-creation | AGENTS.md (skills table) |
