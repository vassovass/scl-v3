# PRD 35: SEO Comparison Pages

> **Order:** 35 of 36
> **Previous:** [PRD 34: B2B Landing Pages](./PRD_34_B2B_Landing.md)
> **Next:** [PRD 36: Technical Debt](./PRD_36_Technical_Debt.md)
> **Status:** 📋 Proposed
> **Phase:** Marketing & Growth
> **Depends on:** PRD 34 (for internal linking)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules
   - PRD 34 - B2B landing pages (for internal links)
   - Existing marketing pages

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

3. **After completion:**
   - Commit with message format: `feat(PRD-35): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**SEO Opportunity:** "X vs Y" comparison searches represent high-intent traffic.
**Current:** StepLeague doesn't rank for any comparison queries.

---

## Outcome

SEO-optimized comparison pages:
1. **Hub page** at `/compare`
2. **Individual comparisons** at `/compare/stepleague-vs-{competitor}`
3. **Schema markup** for rich snippets
4. **Internal linking** to /teams and product pages

---

## URL Structure

```
/compare                              # Hub index
├── /compare/stepleague-vs-fitbit     # Individual comparison
├── /compare/stepleague-vs-strava
├── /compare/stepleague-vs-yumuuv
└── ... etc
```

---

## Page Template

Each comparison page follows this structure:

| Section | Purpose |
|---------|---------|
| **H1 + Intro** | Target keyword + 2-sentence overview |
| **Quick Verdict** | Which to choose (featured snippet) |
| **Feature Table** | Side-by-side checkmark comparison |
| **Detailed Analysis** | 3-4 category breakdowns |
| **Pricing** | Transparent pricing comparison |
| **Pros & Cons** | Balanced for both products |
| **FAQ** | 5-8 common questions (FAQ schema) |
| **CTA** | Try StepLeague free |

---

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Frontend Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Hub loads | `/compare` | List of comparisons visible |
| Comparison loads | `/compare/stepleague-vs-fitbit` | Full comparison content |
| Mobile table | Mobile view | Comparison table format readable |
| Schema data | View Source | JSON-LD FAQ schema present |
| Internal links | Click "For Teams" | Navigates to `/teams` |

### Code Checks

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Build passes | `npm run build` | No errors |
| Schema validator | External tool | Valid JSON-LD markup |

### Documentation Checks

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated

---

## Feature Flag

N/A - Public marketing pages.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for SEO comparison pages |
