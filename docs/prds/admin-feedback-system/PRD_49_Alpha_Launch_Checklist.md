# PRD 49: Alpha Launch Checklist (Meta-PRD)

> **Order:** 49
> **Status:** 📋 Proposed
> **Type:** Meta/Tracking
> **Dependencies:** PRD 43, 44, 45, 46
> **Blocks:** None

---

## 🎯 Objective

Track all requirements and tasks needed before inviting friends and family to alpha test StepLeague. This is a living checklist document that coordinates the alpha launch effort across multiple PRDs.

**Problem Solved:** Multiple PRDs need to be completed for alpha. This checklist provides a single view of readiness and prevents launching with critical gaps.

---

## 🚀 Alpha Launch Criteria

### Must Have (Blocking)

| # | Requirement | PRD | Status | Notes |
|---|-------------|-----|--------|-------|
| 1 | Nickname field at signup with global visibility disclosure | PRD 43 | ⬜ | Repurpose display_name |
| 2 | New users auto-enrolled in World League | PRD 44 | ⬜ | On auth callback |
| 3 | "Why Upload" public value prop page | PRD 45 | ⬜ | Marketing/education |
| 4 | Global leaderboard shows all World League members | PRD 23 | ⬜ | Verify working |
| 5 | Points system documented (design only) | PRD 46 | ⬜ | No implementation needed |
| 6 | Basic onboarding flow works | Existing | ✅ | Joyride tours exist |
| 7 | Step submission works (single + batch) | Existing | ✅ | Core functionality |
| 8 | Private league creation/joining works | Existing | ✅ | Core functionality |

### Should Have (Important but not blocking)

| # | Requirement | PRD | Status | Notes |
|---|-------------|-----|--------|-------|
| 9 | Welcome toast for World League enrollment | PRD 44 | ⬜ | Nice to have |
| 10 | Onboarding mentions global leaderboard | PRD 43 | ⬜ | Update tour content |
| 11 | Footer links to "Why Upload" page | PRD 45 | ⬜ | Discoverability |
| 12 | Head-to-head league design documented | PRD 47 | ⬜ | Future feature preview |

### Nice to Have (Can launch without)

| # | Requirement | PRD | Status | Notes |
|---|-------------|-----|--------|-------|
| 13 | Universal health measurement documented | PRD 48 | ⬜ | Long-term vision |
| 14 | Email invite templates ready | N/A | ⬜ | Manual invites OK |
| 15 | Performance audit complete | PRD 39 | ✅ | Already done |

---

## 📋 Pre-Launch Verification Checklist

### User Flow Testing

- [ ] **New User Signup**
  - [ ] Can create account with nickname
  - [ ] See disclosure about global leaderboard
  - [ ] Auto-enrolled in World League
  - [ ] Redirected to dashboard
  - [ ] Onboarding tour starts

- [ ] **First Submission**
  - [ ] Can submit steps (single entry)
  - [ ] Can submit batch (multiple screenshots)
  - [ ] Submission appears in history
  - [ ] Steps count on World League leaderboard

- [ ] **Global Leaderboard**
  - [ ] `/leaderboard` shows World League rankings
  - [ ] User can see their rank
  - [ ] Period filters work (week, month, all-time)
  - [ ] High-fives work

- [ ] **Private League**
  - [ ] Can create league
  - [ ] Can share invite code
  - [ ] Invitee can join with code
  - [ ] League leaderboard shows members

### Technical Checks

- [ ] **Build & Deploy**
  - [ ] `npm run build` succeeds
  - [ ] `npx tsc --noEmit` passes
  - [ ] No console errors in production
  - [ ] PWA installable

- [ ] **Database**
  - [ ] World League exists in production
  - [ ] RLS policies working
  - [ ] No obvious security holes

- [ ] **Performance**
  - [ ] Pages load < 3s on mobile
  - [ ] No infinite loops
  - [ ] Leaderboard doesn't crash

### Documentation

- [ ] **Internal**
  - [ ] CHANGELOG updated
  - [ ] ROADMAP updated
  - [ ] PRD Index updated

- [ ] **User-Facing**
  - [ ] "Why Upload" page live
  - [ ] How It Works page accurate
  - [ ] Privacy policy current

---

## 📧 Alpha Invite Communication

### Invite Message Template (Draft)

```
Hey [Name]!

I'm inviting you to try StepLeague - a step counting competition app I've been building.

Here's how it works:
1. Sign up and choose your nickname (this appears on the global leaderboard!)
2. Upload a screenshot of your daily steps
3. See how you rank against everyone worldwide

You're automatically in the Global League, but we can also create a private league for [our group/office/family].

Try it: https://scl-v3.vercel.app

Let me know what you think - I'm looking for honest feedback!

[Your name]
```

### Feedback Collection

- Use existing feedback widget (💬 button)
- Direct users to `/roadmap` for feature voting
- Collect via WhatsApp/Signal for quick feedback

---

## 🗓️ Launch Timeline

| Phase | Tasks | Target |
|-------|-------|--------|
| **Phase 1: Core PRDs** | PRD 43, 44, 45 implementation | Week 1 |
| **Phase 2: Testing** | Full user flow testing | Week 1-2 |
| **Phase 3: Bug Fixes** | Address critical issues | Week 2 |
| **Phase 4: Soft Launch** | Invite 5-10 close friends | Week 2-3 |
| **Phase 5: Expand** | Invite 20-50 friends & family | Week 3-4 |

---

## 🔗 Related Documents

- [PRD 43: Nickname Identity](./PRD_43_Nickname_Primary_Identity.md)
- [PRD 44: Auto-Enroll World League](./PRD_44_Auto_Enroll_World_League.md)
- [PRD 45: Why Upload Daily](./PRD_45_Why_Upload_Daily.md)
- [PRD 46: Points System](./PRD_46_Points_Scoring_System.md)
- [ROADMAP.md](../../../ROADMAP.md) - Current stage: Alpha

---

## Progress Tracking

| Date | Update |
|------|--------|
| 2026-01-20 | Created checklist, PRDs 43-49 drafted |
| | |

---

## 🔍 Systems/Design Considerations

_Things to understand/investigate during implementation (not do immediately):_

1. **Checklist as Living Document** - This PRD should be updated as items complete; the checkboxes above are the source of truth for alpha readiness. Consider linking to a GitHub project board or automating status updates from test results (e.g., CI passing = checkbox checked).

2. **Dependency Tracking** - Visualize which PRDs block others. Current dependencies: PRD 43 → PRD 44 (nickname must exist before World League enrollment can reference it), PRD 44 → PRD 45 (auto-enrollment validates "Why Upload" messaging). Update this PRD's dependency section if new blockers are discovered.

3. **Rollback Plan** - If alpha feedback is severe (critical bugs, user complaints), what's the rollback strategy? Document which features can be feature-flagged off without breaking the app. Consider: World League enrollment can be disabled, "Why Upload" page can be hidden, but nickname field is harder to revert.

---

## 💡 Proactive Considerations

_Forward-thinking items that anticipate future needs:_

1. **Feedback Triage Process** - Plan how alpha feedback is categorized before the flood arrives. Suggested categories: `bug-critical`, `bug-minor`, `ux-issue`, `feature-request`, `unclear`. Use the existing feedback widget's tags or create a simple spreadsheet. Prevents paralysis when 20 pieces of feedback arrive in week 1.

2. **Metrics Dashboard** - Define key alpha metrics upfront and ensure analytics are in place BEFORE inviting users:
   - DAU (daily active users) - tracked via page views
   - Submission rate - submissions per day per active user
   - Retention (D1, D7) - users returning after signup
   - Leaderboard engagement - leaderboard page views per user

3. **Staged Rollout Gates** - Define clear criteria for scaling from 5 → 20 → 50 users:
   - **5 users**: No critical bugs reported, app loads < 3s
   - **20 users**: 80% DAU in first week, no data loss incidents
   - **50 users**: Feedback triage process working, at least 1 private league created

   This prevents scaling too fast before stability is proven.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-20 | Initial | Created alpha launch tracking document |
| 2026-01-20 | Systems/Proactive | Added modular design considerations and forward-thinking items |
