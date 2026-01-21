# Sprint PRD Execution Prompt

Use this prompt to continue Sprint work in each new conversation.

---

## Quick Start (Copy This)

```
Continue Sprint 1. Read AGENTS.md, CHANGELOG, PRD_00_Index.md, and relevant skills in .agent/skills/. Do the next incomplete PRD. Finish it completely, then commit and push. One PRD at a time. Follow the technical approach below.
```

---

## Full Prompt Template

```
Continue Sprint 1 work starting from PRD index (docs/prds/admin-feedback-system/PRD_00_Index.md).

**Context to load first:**
1. AGENTS.md - Project rules, patterns, critical rules
2. CHANGELOG.md - Recent work and what's already done
3. PRD_00_Index.md - Sprint status and PRD order
4. .agent/skills/ - Available skills for patterns (supabase-patterns, auth-patterns, testing-patterns, etc.)
5. Previous conversation summaries if referenced

**Working style:**
- One PRD at a time, finish completely before moving to next
- Git commit and push after each PRD completion (follow commit format from AGENTS.md)
- Update PRD status in: individual PRD file, PRD_00_Index.md, and CHANGELOG.md

**Technical approach:**

1. **Modularity & Reuse:**
   - Check existing components/utilities before creating new ones
   - Use established patterns from skills (.agent/skills/)
   - Create reusable modules that other PRDs can leverage
   - Follow existing naming conventions and file structures

2. **Systems Thinking:**
   - Consider how changes affect the whole system
   - Check dependencies and downstream impacts
   - Ensure consistency with existing patterns
   - Update type definitions if needed

3. **Future-Proofing:**
   - Design for extension without over-engineering
   - Consider edge cases and document decisions
   - Add appropriate constants/config for later changes

4. **MCP & Database Usage:**
   - Use Supabase MCP for database queries and migrations
   - Check GA4/GTM MCPs for analytics requirements
   - Use PostHog MCP for feature flags if needed
   - Query existing data to understand current state before changes

**Quality gates:**
- Build must pass (npm run build)
- Tests should pass (npm run test)
- Update all relevant documentation
- Commit and push before ending conversation
```

---

## Proactive Considerations (Apply to Each PRD)

1. **Data Audit First** - Query Supabase to understand current data state before making schema or logic changes. What data exists? What edge cases might be affected?

2. **Analytics Coverage** - Does this PRD need new analytics events? Check analytics.ts and GTM/GA4 MCPs for existing tracking patterns.

3. **Skill Reuse Check** - Before implementing, scan .agent/skills/ for relevant patterns. If a new pattern emerges, consider creating or updating a skill.

4. **Test Strategy** - What tests are needed? Check existing test patterns in the same domain. Add unit tests for new utilities, integration tests for API changes.

---

## Current Sprint 1 Status (Updated: 2026-01-21)

| PRD | Title | Status |
|-----|-------|--------|
| 43 | Nickname Identity | ✅ Complete |
| 44 | Auto-Enroll World League | ✅ Complete |
| 45 | Why Upload Daily | ✅ Complete |
| 46 | Points System (Design Only) | 📋 Next |
| 49 | Alpha Launch Checklist | 📋 Pending |

**Sprint 1 Gate:** New user → signup → see nickname on World League → understand why uploading matters
