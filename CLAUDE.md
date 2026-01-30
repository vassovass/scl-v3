# CLAUDE.md - Claude Code Context

> **For Claude Code / Claude AI assistants**
> This file references the canonical context in AGENTS.md

## Quick Reference

See **[AGENTS.md](./AGENTS.md)** for complete project context including:
- Project structure and tech stack
- Critical coding patterns
- Database schema
- Common issues and fixes

## Agent Skills

Skills are available in `.claude/skills/` (synced from `.agent/skills/`).

> **New skills require user approval** — see `skill-creation` skill.

| Skill | Purpose |
|-------|---------|
| `api-handler` | API route pattern with `withApiHandler` |
| `architecture-philosophy` | Modular design, system thinking |
| `design-system` | CSS variables, theming, UI patterns |
| `error-handling` | `AppError` class, error codes |
| `form-components` | Reusable form inputs with accessibility |
| `prd-creation` | Outcome-based PRD writing |
| `project-updates` | Updating changelog, roadmap, kanban |
| `supabase-patterns` | MCP usage, database, RLS |
| `skill-creation` | **Meta-skill**: Creating new skills, approval workflow |
| `react-debugging` | **NEW** Infinite loops, useMemo/useCallback |
| `typescript-debugging` | **NEW** Build errors, tsc failures |
| `testing-patterns` | **NEW** Testing, mocking Supabase |
| `auth-patterns` | **NEW** getUser/getSession, deadlocks |
| `middleware-patterns` | **NEW** Protected routes, redirects |
| `analytics-tracking` | **NEW** Event tracking (GA4+PostHog), adding events |
| `mcp-setup` | **NEW** MCP server configuration and troubleshooting |
| `social-sharing` | Sharing features, OG images, **multi-select message builder** |

## Claude-Specific Notes

1. **Read AGENTS.md first** - it contains all patterns and architecture decisions
2. **Use untyped Supabase** - no `<Database>` generics
3. **Mobile-first styling** - base = mobile, add `md:`, `lg:` for larger screens
4. **Use adminClient** - for all database operations in API routes
5. **Test before pushing** - `npx tsc --noEmit` catches type errors

## Memory Persistence

Claude Code automatically loads this file. For persistent context, add notes here that should survive across sessions. Current context is maintained in AGENTS.md.

