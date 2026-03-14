# AGENTS.md — StepLeague v3

> Universal context file for AI coding assistants.
> Supported: Cursor, Claude Code, GitHub Copilot, OpenAI Codex, Google Jules, JetBrains AI, Windsurf, Aider

> **StepLeague** — Next.js 14 + TypeScript + Supabase + Tailwind CSS. Competitive step-tracking league platform where users form leagues and compete weekly.

---

## Design Philosophy (apply to every task)

Think in systems, not solutions. Every implementation should strengthen the whole platform.

1. **Systems thinking** — Consider how this change affects the entire application. Map dependencies, side effects, and downstream impacts before writing code.
2. **Design systems thinking** — Build on the existing design system (shadcn/ui + CSS variables). Every UI element should be a composable, themed component — never one-off styling.
3. **Modular architecture** — Extract reusable patterns. If it solves one case, ask: "Will this pattern be needed elsewhere?" If yes, make it generic. Use settings over hardcoding, registries over inline strings.
4. **Proactive & future-proof** — Design for tomorrow, implement for today. Use feature flags (`useFeatureFlag()`), configurable settings (`useAppSettings()`), and extensible schemas. Gate new features, don't hardcode limits.
5. **Compound value** — Every feature should make the next feature easier to build. One direction in the code: find the existing way, use that way, strengthen that way. Never create parallel approaches.

For detailed principles, anti-patterns, and decision frameworks → see `architecture-philosophy` skill.

---

## Golden Rules (non-negotiable)

1. **Convention-first development** — Before writing ANY code: (a) search the codebase for how similar things are already done, (b) identify the existing convention, (c) follow that convention exactly, (d) extend it if needed — never introduce a competing pattern. If no convention exists, establish one worth reusing.
2. **Mobile-first** — Base styles = mobile. Add `md:`, `lg:` prefixes for larger screens. Never desktop-first.
3. **Untyped Supabase** — NEVER use `<Database>` generics. Always untyped: `adminClient.from("table").select("*")`.
4. **withApiHandler** — All new API routes MUST use `withApiHandler` from `@/lib/api/handler`. See `api-handler` skill for details.
5. **Suspense** — Any component using `useSearchParams()` MUST be wrapped in a `<Suspense>` boundary at page level.

---

## Architecture Essentials

- **Steps are league-agnostic** — Submitted ONCE, apply to ALL leagues. No per-league step submission.
- **Offline-first** — Never block user interaction. Use `useOfflineQueue` for mutations when offline.
- **Error handling** — Use `AppError` class from `@/lib/errors`. See `error-handling` skill.
- **API routes** — Always use `adminClient` (bypasses RLS). Validate permissions via auth levels.
- **Caching** — Use `CacheRegistry` keys, never inline strings. See `rules/architecture.md`.
- **Auth** — Never call `getSession()` (deadlocks). Use `getUser()` or parse cookie. See `rules/supabase-auth.md`.

---

## DO NOT

- Call `getSession()` — it deadlocks (use `getUser()` or parse cookie directly)
- Use `<Database>` generics with Supabase
- Manually register service workers — `@ducanh2912/next-pwa` handles it
- Store auth tokens in IndexedDB or localStorage — tokens stay in cookies only
- Hardcode redirect paths — use flexible, configurable redirects
- Use placeholder images — generate with AI
- Skip mobile styling — always mobile-first
- Use RLS-based queries in API routes — use `adminClient`

---

## Before Finishing Any Task (MANDATORY)

1. `npx tsc --noEmit` — must pass, no exceptions
2. Verify the change works as intended
3. Run relevant tests: `npx vitest run`
4. If you changed a documented pattern, update the relevant rule/skill/doc file
5. Review `.claude/skills/` — scan ALL available skills and assess which are relevant to your task
6. Convention check: did you follow existing codebase patterns? Grep for similar implementations and verify your code matches their approach — same utilities, same structure, same naming.
7. Update CHANGELOG.md with your changes (see `project-updates` skill for format)
8. Update roadmap if completing a user-facing feature (see `project-updates` skill for API)

---

## Keeping Context Current (MANDATORY)

When you modify a pattern documented in `.claude/rules/` or `.claude/skills/`:
- Update the rule/skill file to match the new pattern
- If the pattern is referenced in AGENTS.md, update the one-liner here too
- Never leave stale documentation — if you change the code, change the docs
- See `.claude/rules/documentation.md` for the full cross-reference sync map

---

## Commands

| Task | Command |
|------|---------|
| Type check | `npx tsc --noEmit` |
| Test | `npx vitest run` |
| Dev server | `npm run dev` |
| Lint | `npx next lint` |
| Single test | `npx vitest run path/to/test` |

---

## Date Awareness

Today's date context is provided in system prompt. Use absolute dates (YYYY-MM-DD), never relative.
All date operations use `date-fns`. Week starts Monday (ISO 8601). Locale: `en-GB`.

---

## Skills (load on demand — review ALL before finishing any task)

| Skill | When to use |
|-------|-------------|
| `api-handler` | Creating or modifying API routes |
| `architecture-philosophy` | System design decisions, modularity, reusability |
| `auth-patterns` | Authentication, session management, deadlocks |
| `design-system` | Theming, CSS variables, colors, dark/light mode |
| `error-handling` | Error classes, error boundaries, AppError |
| `form-components` | Building forms with validation and accessibility |
| `analytics-tracking` | Adding GA4 or PostHog events |
| `middleware-patterns` | Route protection, redirects |
| `supabase-patterns` | Database queries, RLS, MCP usage |
| `testing-patterns` | Writing tests, mocking Supabase |
| `react-debugging` | Infinite loops, useMemo/useCallback issues |
| `typescript-debugging` | Build errors, tsc failures |
| `project-updates` | Changelog, roadmap, kanban, documentation |
| `social-sharing` | Sharing features, OG images, multi-select builder |
| `prd-creation` | Writing outcome-based PRDs |
| `skill-creation` | Creating new agent skills (requires approval) |
| `mcp-setup` | MCP server configuration and troubleshooting |

---

## Context Loading Guide

Rule files in `.claude/rules/` load automatically based on which files you edit:

| Domain | Rule File | Triggers on |
|--------|-----------|-------------|
| API routes | `rules/api-patterns.md` | `src/app/api/**`, `src/lib/api/**` |
| UI / Components | `rules/ui-components.md` | `src/components/**`, `src/app/(dashboard)/**` |
| Auth / Supabase | `rules/supabase-auth.md` | `src/lib/supabase/**`, `src/middleware.ts`, `src/app/(auth)/**` |
| Architecture | `rules/architecture.md` | `src/lib/**`, `src/hooks/**`, `src/app/**` |
| Analytics | `rules/analytics.md` | `src/lib/analytics*`, `src/components/analytics/**` |
| Documentation | `rules/documentation.md` | `CHANGELOG.md`, `ROADMAP.md`, `docs/**` |

Reference docs (read on demand when needed):
- `docs/DATABASE_SCHEMA.md` — Table structure and relationships
- `docs/THEME_SYSTEM.md` — CSS variables and theming architecture
- `docs/PROJECT_STRUCTURE.md` — Directory layout and route groups
- `docs/DEVELOPMENT_GUIDE.md` — Dev setup, common issues, environment
- `docs/FORM_SYSTEM.md` — Reusable form component library
- `docs/MCP_SERVERS.md` — Available MCP servers and quick commands

---

## MCP Servers

| Server | Purpose |
|--------|---------|
| Supabase | Database access, migrations, SQL execution |
| PostHog | Analytics, feature flags, experiments |
| Google Tag Manager | Tag creation and publishing |
| Google Analytics 4 | Report generation |
| Playwright | Browser automation and testing |

---

## Related Files

- `CHANGELOG.md` — Version history (Keep a Changelog format)
- `ROADMAP.md` — Feature roadmap with kanban columns
- `ARCHITECTURE.md` — Technical architecture deep dive
- `docs/` — Reference documentation
- `.claude/skills/` — Detailed patterns and workflows
- `.claude/rules/` — Behavioral rules (auto-loaded by file path)
- `docs/prds/` — Product requirement documents (PRD 01-66)
