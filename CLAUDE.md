# CLAUDE.md — Claude Code Context

> StepLeague v3: Next.js 14 + TypeScript + Supabase + Tailwind CSS

## Read First

- **[AGENTS.md](./AGENTS.md)** — Universal rules, design philosophy, skills reference, and pre-completion checklist
- Rule files in `.claude/rules/` load automatically based on which files you're editing

## Critical Rules

1. **Think in systems** — Before solving, map the full impact: dependencies, side effects, reusability. Every change should strengthen the whole platform.
2. **Convention-first** — Search codebase, identify existing convention, follow it, extend if needed. Never introduce competing patterns.
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

