# PRD 69: SEO Content Pages

> **Order:** 69
> **Status:** ✅ Complete
> **Type:** Feature
> **Dependencies:** PRD 35 (SEO Comparison Pages — complete)
> **Blocks:** None

---

## 🎯 Objective

Create SEO-optimized content marketing pages that capture search traffic from people looking for step challenge solutions. The site currently has product pages (`/compare`, `/how-it-works`, `/pricing`, `/teams`) but lacks intent-focused content pages targeting how real users search for these solutions.

Each page targets a distinct keyword angle, audience segment, and search intent — expanding StepLeague's organic reach beyond brand-aware visitors.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/app/(public)/compare/page.tsx` | Existing SEO comparison hub — internal link target |
| `src/lib/compare/comparisons.ts` | Competitor data registry — reuse for content accuracy |
| `src/lib/config.ts` | APP_CONFIG with domain, tagline, branding |
| `src/app/(public)/how-it-works/page.tsx` | Internal link target |
| `src/app/(public)/pricing/page.tsx` | Internal link target |
| `src/app/(public)/teams/page.tsx` | B2B landing page — internal link target |
| `src/app/(public)/why-upload/page.tsx` | Internal link target |
| `C:\Users\vasso\.claude\skills\seo-agi\SKILL.md` | SEO content framework — research, structure, quality gate |
| `C:\Users\vasso\.claude\skills\seo-agi\scripts\research.py` | DataForSEO competitive research script |
| `C:\Users\vasso\.claude\skills\seo-agi\references\schema-patterns.md` | JSON-LD schema templates |
| `C:\Users\vasso\.claude\skills\seo-agi\references\page-templates.md` | Page structure templates |
| `.claude/skills/human-writer/SKILL.md` | Humanization pass — remove AI tells, add natural voice |

### MCP Servers

_None required — this PRD produces static content files, not code._

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Run seo-agi research for all 3 keywords `[PARALLEL]` |
| 2 | `[WRITE]` | Write page 1: "step challenge app" `[PARALLEL with 3, 4]` |
| 3 | `[WRITE]` | Write page 2: "walking challenge with friends" `[PARALLEL with 2, 4]` |
| 4 | `[WRITE]` | Write page 3: "workplace step challenge" `[PARALLEL with 2, 3]` |
| 5 | `[WRITE]` | Apply human-writer pass to all 3 pages `[SEQUENTIAL]` |
| 6 | `[READ-ONLY]` | Run quality scorecard on each page `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Keyword Research — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | Research "step challenge app" via DataForSEO | Need SERP data, competitor content, PAA questions, word count targets | Research script returns SERP top 10, related keywords, PAA questions |
| **A-2** | Research "walking challenge with friends" via DataForSEO | Need competitive intelligence for social/friend angle | Research script returns data; brief constructed with intent, audience, gaps |
| **A-3** | Research "workplace step challenge" via DataForSEO | Need competitive intelligence for B2B/corporate angle | Research script returns data; brief constructed with intent, audience, gaps |

### Section B: Content Pages — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **"step challenge app"** page | No landing page for users searching for challenge apps | Commercial intent page with comparison table, "Not For You" block, FAQ (3+ PAA), JSON-LD schema, 16+/20 scorecard |
| **B-2** | **"walking challenge with friends"** page | No page addressing the social/friend motivation angle | Social/commercial page targeting friend groups wanting accountability, with specific use cases and internal links |
| **B-3** | **"workplace step challenge"** page | `/teams` is a waitlist page, not an SEO content piece | B2B-focused content page for HR managers with ROI data, setup guidance, pricing context, internal link to `/teams` |

### Section C: Content Quality — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | Human-writer pass applied to all pages | AI-generated content sounds robotic | Medium humanization: sentence variation, contractions, natural transitions, no AI tell-tale words |
| **C-2** | 500-token chunk architecture | Content must be extractable by AI answer engines | Every H2 followed by direct answer (2-3 sentences), self-contained chunks, no split tables |
| **C-3** | Hub/spoke internal links | Pages must link to existing StepLeague routes | Each page links to relevant existing pages (`/compare`, `/how-it-works`, `/pricing`, `/teams`) |
| **C-4** | `{{VERIFY}}` tags on all claims | Prevent publishing unverified numbers | Every price, stat, capacity, or specific claim tagged with verification source |
| **C-5** | JSON-LD schema markup | Pages need structured data for rich results | FAQPage + BreadcrumbList schema per page; SoftwareApplication for "step challenge app" page |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Pages created | 3 markdown files in `proposed-seo/` | `ls proposed-seo/` shows 3 .md files |
| Quality score | Each page 16+/20 on seo-agi scorecard | Scorecard printed at end of each page |
| Human-writer pass | No AI tell-tale words (delve, robust, crucial, etc.) | Grep for banned words returns 0 matches |
| Internal links | Each page links to 2+ existing routes | Manual review of link targets |
| Research data | All 3 keywords researched | Research JSON files saved |

---

## 📅 Implementation Plan Reference

### Phase 1: Research
1. Run `research.py` for each keyword (parallel if possible)
2. Analyze SERP data, competitor gaps, PAA questions
3. Build brief per page (word count, H2 structure, information gain target)

### Phase 2: Content Creation
4. Write each page following seo-agi Section 8 structure
5. Apply human-writer skill at "medium humanization" level
6. Add JSON-LD schema blocks
7. Run 20-point quality scorecard

### Phase 3: Output
8. Save to `proposed-seo/` at project root

---

## 📊 Page Specifications

### Page 1: "step challenge app"

| Field | Value |
|-------|-------|
| **Target keyword** | step challenge app |
| **Search intent** | Commercial |
| **Page type** | Product/comparison |
| **Audience** | People ready to start a group step challenge |
| **Information gain** | AI verification as differentiator, device-agnostic comparison, real pricing data |
| **Reddit test** | r/fitness — would a regular commenter find useful, specific recommendations? |
| **Schema** | FAQPage + SoftwareApplication + BreadcrumbList |
| **Output** | `proposed-seo/step-challenge-app.md` |

### Page 2: "walking challenge with friends"

| Field | Value |
|-------|-------|
| **Target keyword** | walking challenge with friends |
| **Search intent** | Commercial/Social |
| **Page type** | Guide + Product |
| **Audience** | Friend groups wanting walking accountability |
| **Information gain** | How to set up a challenge across mixed devices, motivation psychology, real group dynamics |
| **Reddit test** | r/loseit or r/walking — would someone planning a friend challenge save this? |
| **Schema** | FAQPage + HowTo + BreadcrumbList |
| **Output** | `proposed-seo/walking-challenge-with-friends.md` |

### Page 3: "workplace step challenge"

| Field | Value |
|-------|-------|
| **Target keyword** | workplace step challenge |
| **Search intent** | Commercial/B2B |
| **Page type** | Service page |
| **Audience** | HR managers, office wellness organizers |
| **Information gain** | Setup logistics, participation rates, device compatibility across employees, free vs enterprise pricing |
| **Reddit test** | r/humanresources — would an HR manager find actionable guidance? |
| **Schema** | FAQPage + BreadcrumbList |
| **Output** | `proposed-seo/workplace-step-challenge.md` |

---

## StepLeague Facts (for content accuracy)

- **Domain:** stepleague.app
- **Tagline:** "Step competition with friends"
- **How it works:** Upload screenshot from any fitness app → AI verifies → compete on leaderboards
- **Compatible with:** Apple Health, Google Fit, Samsung Health, Garmin Connect, Fitbit, any step tracker
- **Features:** AI verification, private leagues, global leaderboard, daily/weekly rankings, High Fives, calendar heatmaps, streaks, analytics
- **Pricing:** Free tier (unlimited steps, global leaderboard, public leagues). Premium coming soon (privacy mode, private leagues, advanced analytics)
- **Competitors:** Fitbit Challenges, Strava, Garmin Connect, Apple Fitness+, YuMuuv, Stridekick
- **Key differentiator:** Device-agnostic + AI screenshot verification = fair play across mixed device groups

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 69 as Proposed, update counts
- [ ] CHANGELOG.md — Log PRD creation
- [ ] No AGENTS.md changes needed (no new code patterns)
- [ ] No skill file changes needed
- [ ] **Git commit** — `docs(prd): PRD 69 — SEO content pages for organic growth`

---

## 📚 Best Practice References

- **seo-agi framework:** 500-token chunk architecture, 7 Google AI ranking signals, Reddit Test quality gate
- **human-writer skill:** Medium humanization — sentence variation, contractions, natural transitions
- **Google E-E-A-T:** Experience, Expertise, Authoritativeness, Trustworthiness signals in content
- **Schema.org:** FAQPage, SoftwareApplication, HowTo, BreadcrumbList markup standards

---

## 🔗 Related Documents

- [PRD 35: SEO Comparison Pages](./PRD_35_SEO_Comparison.md) — Established the comparison page pattern
- [PRD 34: B2B Landing Pages](./PRD_34_B2B_Landing.md) — Created `/teams` page this PRD supplements

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-23 | Initial | Created PRD |

---

## Amendment Log

_Track adjustments requested during execution so preferences carry forward._

| Date | Amendment | Reason |
|------|-----------|--------|
| 2026-03-23 | Output to `proposed-seo/` folder, not `~/Documents/SEO-AGI/` | User wants side-by-side comparison with existing pages |
| 2026-03-23 | Determine multiple keyword angles instead of using literal keyword | User wants strategic keyword research, not literal execution |
| 2026-03-23 | Apply human-writer skill pass to all output | Ensure content sounds natural, not AI-generated |
| 2026-03-23 | Use markdown format, not .tsx components | Easier to review before integrating |
| 2026-03-23 | Create as PRD for reusability | User wants to reuse this pattern for future SEO work |
