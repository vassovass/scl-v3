# CLAUDE.md - Claude Code Context

> **For Claude Code / Claude AI assistants**
> This file references the canonical context in AGENTS.md

## Quick Reference

See **[AGENTS.md](./AGENTS.md)** for complete project context including:
- Project structure and tech stack
- Critical coding patterns
- Database schema
- Common issues and fixes

## Claude-Specific Notes

1. **Read AGENTS.md first** - it contains all patterns and architecture decisions
2. **Use untyped Supabase** - no `<Database>` generics
3. **Mobile-first styling** - base = mobile, add `md:`, `lg:` for larger screens
4. **Use adminClient** - for all database operations in API routes
5. **Test before pushing** - `npx tsc --noEmit` catches type errors

## Memory Persistence

Claude Code automatically loads this file. For persistent context, add notes here that should survive across sessions. Current context is maintained in AGENTS.md.
