---
description: Skill creation and modification rules — AGENTS.md sync, approval, naming
paths:
  - .agent/skills/**
  - .claude/skills/**
---

# Skill Rules

## ⚠️ MANDATORY: Update AGENTS.md Skills Table

**Every time you create, rename, or delete a skill, you MUST update the skills table in `AGENTS.md`:**

- Add/remove the row in the `Skills` section
- Match the format: `| \`skill-name\` | When to use description |`

Skipping this makes the skill invisible — agents check AGENTS.md to discover available skills.

## Skill Creation Requires Approval

**Never create a new skill without user approval.** See `skill-creation` skill for the full workflow.

## SKILL.md Frontmatter

Every skill MUST have:
```yaml
---
name: skill-name
description: Third-person description under 1024 chars. Include WHAT it does and WHEN to use it.
compatibility: Antigravity, Claude Code, Cursor
metadata:
  version: "1.0"
  project: "stepleague"
---
```

## Size Limits

- SKILL.md body: under 500 lines
- If larger: split into SKILL.md (essential patterns) + `references/` subdirectory (detailed examples)

## Cross-Reference

When modifying a skill that's referenced in rules or docs, update those too. See the cross-reference sync map in `rules/documentation.md`.
