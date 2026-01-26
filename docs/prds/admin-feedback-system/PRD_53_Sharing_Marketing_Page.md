# PRD 53: Sharing Marketing Page (/how-to-share)

> **Order:** 53
> **Status:** 📋 Proposed
> **Type:** Feature (Marketing/SEO)
> **Dependencies:** PRD 51 (Social Sharing & Stats Hub), PRD 45 (Why Upload Daily - page pattern)
> **Blocks:** None
> **Last Updated:** 2026-01-26

---

## 🎯 Objective

Create a public marketing page at `/how-to-share` that explains and showcases StepLeague's sharing features. The page should convert visitors into users by demonstrating the value of beautiful, shareable achievement cards.

**SEO Target Keywords:** "step tracking sharing", "fitness achievement cards", "WhatsApp fitness sharing"

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `docs/prds/PRD_45_Why_Upload_Daily.md` | Similar public page pattern |
| `src/app/(public)/why-upload/page.tsx` | Reference implementation |
| `src/app/(public)/how-it-works/page.tsx` | Marketing page patterns |
| `.agent/skills/social-sharing/SKILL.md` | Sharing feature patterns |

---

## 🏗️ Detailed Feature Requirements

### Section A: Page Structure — 7 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Public page at `/how-to-share`** | Accessible without login | Route in (public) group |
| **A-2** | **Hero section** | Capture attention | "Share Your Progress Beautifully" headline |
| **A-3** | **How It Works (3 steps)** | Explain process | Upload → Customize → Share visual flow |
| **A-4** | **Example Cards gallery** | Show value | 6 card type examples with hover effects |
| **A-5** | **Benefits section** | Convince visitors | Accountability, motivation, community |
| **A-6** | **Primary CTA** | Convert visitors | "Start Sharing" → /submit-steps (logged in) or /sign-up |
| **A-7** | **Secondary CTA** | Alternative path | "View Demo" → interactive card preview |

### Section B: Content Sections — 5 Items

| # | Section | Content Focus | Visual Element |
|---|---------|---------------|----------------|
| **B-1** | **Why Share Your Steps?** | Accountability benefits, research-backed | Stats icons (👥 67% more motivated) |
| **B-2** | **Beautiful Cards** | OG image quality, platform compatibility | Card examples grid |
| **B-3** | **WhatsApp Optimized** | Primary use case, group sharing | WhatsApp UI mockup |
| **B-4** | **Track Your Progress** | Self-comparison, personal bests | Progress visualization |
| **B-5** | **Join the Challenge** | Social proof, community | User count, active leagues |

### Section C: SEO & Performance — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Meta tags optimized** | Search visibility | Title, description, OG tags |
| **C-2** | **Schema markup** | Rich snippets | HowTo schema for "How It Works" |
| **C-3** | **Fast loading** | User experience | LCP < 2.5s |
| **C-4** | **Mobile-first design** | Primary audience | All sections responsive |

---

## ✅ Success Criteria

| Metric | Target | Verification |
|--------|--------|--------------|
| Page loads for logged-out users | 200 OK | Manual test |
| CTA click rate | 10%+ | Analytics |
| Organic traffic | 100+ visits/month (after 3 months) | GA4 |
| Bounce rate | <60% | GA4 |

---

## 📅 Implementation Plan Reference

1. Create page in `src/app/(public)/how-to-share/page.tsx`
2. Design hero section with headline and subheadline
3. Build "How It Works" 3-step component
4. Create card gallery with example share cards
5. Add benefits section with icons
6. Implement dual CTAs (logged in vs logged out)
7. Add SEO meta tags and schema markup
8. Mobile optimize all sections

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-26 | Initial | Created sharing marketing page PRD |
