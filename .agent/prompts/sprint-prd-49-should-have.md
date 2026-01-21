Continue Sprint 1 work - complete PRD 49 "Should Have" requirements (items 9, 10, 11, 12).

Start from PRD index (docs/prds/admin-feedback-system/PRD_00_Index.md).

**Context to load first:**
1. AGENTS.md - Project rules, patterns, critical rules
2. CHANGELOG.md - Recent work and what's already done
3. PRD_00_Index.md - Sprint status and PRD order
4. PRD_49_Alpha_Launch_Checklist.md - The checklist with Should Have section
5. .agent/skills/ - Available skills for patterns (supabase-patterns, auth-patterns, testing-patterns, etc.)
6. Previous conversation summaries if referenced

**Working style:**
- Complete each requirement fully before moving to next
- Git commit and push after completion (follow commit format from AGENTS.md)
- Update PRD 49 checklist checkboxes as you complete each item
- Update CHANGELOG.md with changes made

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

---

## Proactive Considerations (Apply to Each Requirement)

1. **Data Audit First** - Query Supabase to understand current data state before making schema or logic changes. What data exists? What edge cases might be affected?

2. **Analytics Coverage** - Does this requirement need new analytics events? Check analytics.ts and GTM/GA4 MCPs for existing tracking patterns.

3. **Skill Reuse Check** - Before implementing, scan .agent/skills/ for relevant patterns. If a new pattern emerges, consider creating or updating a skill.

4. **Test Strategy** - What tests are needed? Check existing test patterns in the same domain. Add unit tests for new utilities, integration tests for API changes.

---

## Current Task: PRD 49 "Should Have" Section

Complete these requirements from PRD 49's "Should Have" section:

| # | Requirement | PRD Ref | Current Status | Notes |
|---|-------------|---------|----------------|-------|
| 9 | Welcome toast for World League enrollment | PRD 44 | ✅ Done | Verify working |
| 10 | Onboarding mentions global leaderboard | PRD 43 | ⬜ Pending | Update tour content |
| 11 | Footer links to "Why Upload" page | PRD 45 | ⬜ Pending | Discoverability |
| 12 | Head-to-head league design documented | PRD 47 | ⬜ Pending | Future feature preview |

**Task Goal:** Complete items 9, 10, 11, 12 and update PRD 49 checklist accordingly.
