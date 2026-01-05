# PRD 30: SEO Comparison Pages

> **Order:** 30 of 30  
> **Previous:** [PRD 29: B2B Landing](./PRD_29_B2B_Landing.md)  
> **Status:** 📋 Proposed  
> **Phase:** Marketing & Growth  
> **Depends on:** PRD 29 (for internal linking)
> **Next:** [PRD 31: Technical Debt](./PRD_31_Technical_Debt.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules
   - PRD 29 - B2B landing pages (for internal links)
   - Existing marketing pages

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

3. **After completion:**
   - Commit with message format: `feat(PRD-30): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**SEO Opportunity:** "X vs Y" comparison searches represent high-intent traffic.

**Current:** StepLeague doesn't rank for any comparison queries.

**Competitors:**
- B2C: Fitbit, Strava, StepBet, Pacer, Charity Miles
- B2B: Virgin Pulse, YuMuuv, Wellable, Limeade

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
| **Related** | Links to other comparisons |

---

## Schema Markup

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is StepLeague better than Fitbit for team challenges?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "StepLeague is specifically designed for team competitions..."
      }
    }
  ]
}
```

---

## Priority Competitors

### Phase 1 (First 5 Pages)

| Page | Keyword |
|------|---------|
| /compare/stepleague-vs-fitbit | B2C volume |
| /compare/stepleague-vs-strava | B2C brand |
| /compare/stepleague-vs-yumuuv | B2B direct |
| /compare/stepleague-vs-virgin-pulse | B2B enterprise |
| /compare/stepleague-vs-stepbet | B2C competitor |

### Phase 2

Remaining B2C and B2B competitors.

---

## Files to Create

| File | Description |
|------|-------------|
| `src/app/(marketing)/compare/page.tsx` | Hub index |
| `src/app/(marketing)/compare/[slug]/page.tsx` | Dynamic comparison |
| `src/lib/comparisons/data.ts` | Competitor data registry |
| `src/components/marketing/ComparisonTable.tsx` | Feature matrix |
| `src/components/marketing/FAQSection.tsx` | With schema |

---

## Success Criteria

- [ ] Hub page links to all comparisons
- [ ] Comparison template works dynamically
- [ ] FAQ schema renders in Google search
- [ ] Internal links to /teams and product
- [ ] 1,500+ words per page
- [ ] Mobile-responsive tables
- [ ] Build passes

---

## Proactive Enhancements

### 1. User-Contributed Accuracy Ratings

Allow users to rate comparison accuracy:
- "Was this comparison helpful?" thumbs up/down
- Aggregate rating shown on page
- Helps prioritize content updates

### 2. Last Updated Indicator

Show when comparison was last verified:
- "Last updated: January 2026"
- Builds trust with readers
- Reminder for content maintenance

---

## Theme Awareness

All comparison pages must:
- Support both light and dark modes (PRD 21 Part G)
- Use CSS variables for all colors
- Ensure comparison tables are readable in both themes
- Test before publishing

---

## shadcn Components to Use

| Component | Usage |
|-----------|-------|
| `Table` | Feature comparison matrix |
| `Accordion` | FAQ section |
| `Card` | Pros/cons cards |
| `Button` | CTAs |
| `Badge` | "Winner" indicators |

---

## Out of Scope

- Paid competitor research tools
- Automated competitor monitoring
- User-generated reviews

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for SEO comparison pages |
