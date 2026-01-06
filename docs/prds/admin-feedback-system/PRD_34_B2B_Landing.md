# PRD 34: B2B Landing Pages

> **Order:** 34 of 36
> **Previous:** [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md)
> **Next:** [PRD 35: SEO Comparison Pages](./PRD_35_SEO_Comparison.md)
> **Status:** 📋 Proposed
> **Phase:** Marketing & Growth

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/(marketing)/` - Existing marketing pages if any
   - `src/app/globals.css` - Design tokens

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

3. **After completion:**
   - Commit with message format: `feat(PRD-34): Brief description`
   - Mark this PRD as done on the Kanban board

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

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for B2B landing pages |
