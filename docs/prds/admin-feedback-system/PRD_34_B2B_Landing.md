# PRD 29: B2B Landing Pages

> **Order:** 29 of 30  
> **Previous:** [PRD 28: Admin Analytics](./PRD_28_Admin_Analytics.md)  
> **Next:** [PRD 30: SEO Comparison](./PRD_30_SEO_Comparison.md)  
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
   - Commit with message format: `feat(PRD-29): Brief description`
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

Simple email capture before full B2B launch:

```tsx
<main>
  <h1>Team Wellness Challenges Are Coming</h1>
  <p>Be the first to bring healthy competition to your workplace.</p>
  
  <WaitlistForm />
  
  <p>Join 200+ companies on the waitlist</p>
</main>
```

### 3. Features Directory (`/teams/features`)

Organized by use case:

| Category | Features |
|----------|----------|
| Team Building | Team challenges, leaderboards |
| Health & Wellness | Step tracking, streaks, reminders |
| Remote Teams | Cross-location, async participation |
| HR Admin | Reports, analytics, CSV export |

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

CREATE POLICY "SuperAdmin access" ON b2b_waitlist
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));
```

---

## SEO Configuration

```tsx
// /teams/page.tsx
export const metadata: Metadata = {
  title: "Corporate Wellness Step Challenges | StepLeague for Teams",
  description: "Drive employee engagement with fun, competitive step challenges. Easy setup, works with any fitness tracker. Request a demo today.",
  keywords: ["corporate wellness", "employee step challenge", "team fitness", "workplace wellness"],
};
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/app/(marketing)/teams/page.tsx` | Main B2B landing |
| `src/app/(marketing)/teams/features/page.tsx` | Features directory |
| `src/app/(marketing)/teams/waitlist/page.tsx` | Thank you page |
| `src/components/marketing/WaitlistForm.tsx` | Email capture |
| `src/components/marketing/TrustBar.tsx` | Logo bar |
| `src/components/marketing/ValuePropCard.tsx` | Benefit cards |
| `src/app/api/waitlist/route.ts` | Waitlist API |
| `supabase/migrations/YYYYMMDD_b2b_waitlist.sql` | Table |

---

## Success Criteria

- [ ] `/teams` page live with all sections
- [ ] Waitlist form captures email, company, role
- [ ] Features page showcases capabilities
- [ ] Mobile-responsive
- [ ] SEO meta tags configured
- [ ] Build passes (`npm run build`)

---

## Proactive Enhancements

### 1. Live Social Proof Counter

Real-time engagement ticker:
- "🚶 12,456 steps walked by teams today"
- Updates every 30 seconds (via SWR polling)
- Builds urgency and credibility

### 2. Interactive Mini-Demo

Embedded demo without signup:
- Fake leaderboard users can interact with
- "Try giving a high-five" sample
- Reduces friction to understanding product

---

## Theme Awareness

Landing pages should:
- Support both light and dark modes (PRD 21 Part G)
- Default to user's system preference
- Use CSS variables for all colors
- Ensure hero images work in both themes

---

## shadcn Components to Use

| Component | Usage |
|-----------|-------|
| `Button` | CTAs, form submit |
| `Input` | Email capture |
| `Select` | Company size dropdown |
| `Card` | Value prop cards |
| `Toast` | Form submission feedback |

---

## Out of Scope

- Full demo booking system (use Calendly)
- Pricing page (premature)
- Case studies (need customers first)
- Comparison pages (PRD 30)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for B2B landing pages |
