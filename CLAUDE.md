# CLAUDE.md — Claude Code Context

> StepLeague v3: Next.js 14 + TypeScript + Supabase + Tailwind CSS

## Read First

- **[AGENTS.md](./AGENTS.md)** — Universal rules, design philosophy, skills reference, and pre-completion checklist
- Rule files in `.claude/rules/` load automatically based on which files you're editing

## Critical Rules

1. **Think in systems** — Every change should strengthen the whole platform (see Design Philosophy in AGENTS.md)
2. **Check existing patterns first** — Search before creating new components/hooks/utilities
3. **Mobile-first** — Base styles = mobile, add `md:`, `lg:` for larger
4. **Untyped Supabase** — Never use `<Database>` generics
5. **withApiHandler** — All new API routes must use it
6. **Never call `getSession()`** — It deadlocks. Use `getUser()` or parse cookie.

## Quick Commands

- Type check: `npx tsc --noEmit`
- Test: `npx vitest run`
- Dev: `npm run dev`
- Lint: `npx next lint`

## Skills

Skills in `.claude/skills/` provide domain-specific knowledge. They load on demand — only metadata is always present. **Review ALL available skills before finishing any task** to ensure none were missed.

> New skills require user approval — see `skill-creation` skill.

## For Agent Teams

Each teammate should:
- Read AGENTS.md for rules and skill reference
- Use skills for domain-specific knowledge (`.claude/skills/`)
- Check `docs/` for reference material when needed
- Rule files load automatically — no need to read them manually
- Follow the mandatory pre-completion checklist in AGENTS.md before finishing

## Memory Persistence

Claude Code automatically loads this file. For persistent context across sessions, use the memory system at `~/.claude/projects/`. Current project rules are in AGENTS.md and `.claude/rules/`.
