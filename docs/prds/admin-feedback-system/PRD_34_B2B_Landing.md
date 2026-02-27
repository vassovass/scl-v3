# PRD 34: B2B Landing Pages

> **Order:** 34
> **Status:** 📋 Proposed
> **Type:** Feature
> **Dependencies:** None
> **Blocks:** None
> **Previous:** [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md)
> **Next:** [PRD 35: SEO Comparison Pages](./PRD_35_SEO_Comparison.md)
> **Phase:** Marketing & Growth

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/app/(public)/page.tsx` | Homepage — reference for public page patterns |
| `src/app/(public)/compare/page.tsx` | SEO comparison page — reference for SSG patterns |
| `src/app/globals.css` | Design tokens and CSS variables |
| `.claude/skills/design-system/SKILL.md` | CSS variables, UI patterns, shadcn/ui |
| `.claude/skills/form-components/SKILL.md` | Form input patterns with accessibility |
| `.claude/skills/supabase-patterns/SKILL.md` | Database patterns for waitlist table |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Create `b2b_waitlist` table, verify RLS |
| **GA4 Stape MCP** | Verify conversion tracking on waitlist form |
| **GTM Stape MCP** | Set up conversion tags for form submissions |
| **Playwright MCP** | E2E test landing page, waitlist form |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit existing public pages for pattern reference |
| 2 | `[WRITE]` | Create `b2b_waitlist` table migration `[PARALLEL with Phase 3]` |
| 3 | `[WRITE]` | Create `/teams` landing page components `[PARALLEL with Phase 2]` |
| 4 | `[WRITE]` | Create `/teams/features` directory page `[PARALLEL with Phase 2]` |
| 5 | `[WRITE]` | Create waitlist API endpoint and form submission `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Add SEO metadata, JSON-LD, OG images `[SEQUENTIAL]` |
| 7 | `[WRITE]` | Write Vitest + Playwright tests `[SEQUENTIAL]` |

---

## Problem Statement

**Market Opportunity:** Corporate wellness market projected at $93+ billion by 2027.
**Current:** StepLeague has no B2B presence or landing pages.
**Gap:** HR managers searching for "corporate wellness programs" or "employee step challenges" won't find StepLeague.

---

## Outcome

A "StepLeague for Teams" B2B section:
1. **Landing page** at `/teams`
2. **Waitlist** for early access
3. **Features directory** at `/teams/features`
4. **Demo booking** integration

---

## URL Structure

```
/teams                     # Main B2B landing
├── /teams/features        # Features directory
├── /teams/waitlist        # Thank you page after signup
└── /teams/demo            # Calendly/Cal.com embed (future)
```

---

## Pages to Create

### 1. Main Landing Page (`/teams`)

**Sections (in order):**

| Section | Content |
|---------|---------|
| **Hero** | "Team Step Challenges That Drive Engagement" + CTA |
| **Trust Bar** | Client logos or waitlist count |
| **Value Props** | 3-4 benefit cards for HR buyers |
| **Features Grid** | Visual feature overview |
| **How It Works** | 3-step process |
| **Testimonials** | HR professional quotes |
| **Integrations** | Device logos (Fitbit, Garmin, Apple) |
| **CTA** | Waitlist signup or demo booking |

### 2. Waitlist Page (Initial Launch)

Simple email capture before full B2B launch.

### 3. Features Directory (`/teams/features`)

Organized by use case: Team Building, Health, Remote Teams, HR Admin.

---

## Database: B2B Waitlist

```sql
CREATE TABLE b2b_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  company_name TEXT,
  company_size TEXT, -- '1-50', '51-200', '201-500', '500+'
  role TEXT, -- 'HR', 'Wellness', 'Team Lead', 'Other'
  source TEXT, -- 'organic', 'referral', 'linkedin', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ -- When they become a customer
);

-- RLS: SuperAdmin only
ALTER TABLE b2b_waitlist ENABLE ROW LEVEL SECURITY;
```

---

## 🏗️ Detailed Feature Requirements

### Section A: Landing Page — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Main landing at `/teams`** | No B2B presence | Page loads with hero, value props, features, CTA |
| **A-2** | **Features directory at `/teams/features`** | HR managers can't see full feature list | Grid of features organized by use case |
| **A-3** | **Mobile responsive** | B2B buyers browse on mobile | All sections stack properly on mobile |

### Section B: Waitlist & Conversion — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Waitlist form captures leads** | No way to collect B2B interest | Email, company, size, role fields saved to `b2b_waitlist` |
| **B-2** | **Thank you page after signup** | No confirmation after form submit | Redirect to `/teams/waitlist` with confirmation message |
| **B-3** | **Conversion tracking** | Can't measure B2B funnel | GA4 conversion event fires on form submission |

### Section C: SEO — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **SEO optimized metadata** | Pages won't rank for corporate wellness | Title, description, OG tags for "corporate wellness" keywords |
| **C-2** | **JSON-LD structured data** | No rich snippets in search | Organization + Product schema markup |

---

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Frontend Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Page loads | `/teams` | Landing page content visible |
| Waitlist form | `/teams` | Accepts email/company info |
| Submission | Submit form | Redirects to /teams/waitlist |
| Features subpage | `/teams/features` | Loads feature grid |
| SEO title | View Source | "Corporate Wellness..." title present |

### Backend Checks

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Table exists | Query `b2b_waitlist` | Table found |
| Data saved | Submit form | New row in `b2b_waitlist` |
| RLS check | Query as public | No access to waitlist data |

### Documentation Checks

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated

---

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add B2B page patterns
- [ ] `design-system` skill — Add landing page section patterns
- [ ] CHANGELOG.md — Log B2B landing pages
- [ ] PRD_00_Index.md — Update PRD 34 status to ✅ Complete
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 34 — short description`

## 📚 Best Practice References

- **Landing page UX:** Hero -> Trust -> Value Props -> Features -> How It Works -> CTA. Maximum 1 CTA per section.
- **B2B waitlist:** Minimal fields (email required, rest optional). Show social proof (waitlist count) after 10+ signups.
- **SEO:** Target "corporate wellness program", "employee step challenge", "team fitness challenge" keywords.
- **RLS:** `b2b_waitlist` must be SuperAdmin-only read. Public insert for waitlist form.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for B2B landing pages |
