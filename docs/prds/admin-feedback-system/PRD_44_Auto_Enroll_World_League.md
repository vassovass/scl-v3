# PRD 44: Auto-Enroll World League

> **Order:** 44
> **Status:** 📋 Proposed
> **Type:** Feature
> **Dependencies:** PRD 43 (Nickname Identity)
> **Blocks:** None

---

## 🎯 Objective

Automatically enroll all new users in the "StepLeague World" league upon signup. This ensures every user immediately has a leaderboard to compete on, eliminating the friction of finding/joining a league manually and fulfilling the promise of "Global Leaderboard" visibility made during nickname setup.

**Problem Solved:** Currently, users must manually join the World League using invite code "WORLD". New users may not know this exists, leaving them without a leaderboard experience until they join a private league.

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `src/app/api/auth/callback/route.ts` | Auth callback - where user sync happens |
| `supabase/migrations/20260106000000_create_world_league.sql` | World League definition (UUID: `00000000-0000-0000-0000-000000000001`) |
| `src/lib/supabase/server.ts` | Admin client for bypassing RLS |
| `AGENTS.md` | Section 7.1: Steps are league-agnostic |

---

## 🏗️ Detailed Feature Requirements

### Section A: Auto-Enrollment Logic — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **New users auto-join World League** | Immediate leaderboard access | On signup completion, user has membership in World League |
| **A-2** | **Enrollment happens on auth callback** | Reliable trigger point | `POST /api/auth/callback` creates membership after user sync |
| **A-3** | **Idempotent enrollment** | No duplicates if callback fires twice | `ON CONFLICT DO NOTHING` or check-before-insert pattern |
| **A-4** | **Silent failure on error** | Don't block signup | If enrollment fails, log error but continue signup flow |

### Section B: User Experience — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Welcome toast on first dashboard visit** | Awareness of World League membership | Toast: "Welcome to the Global League! See how you rank worldwide." |
| **B-2** | **World League appears in league list** | Visibility | User's league dropdown/list includes "StepLeague World" |
| **B-3** | **Cannot leave World League** (or discouraged) | Maintain global participation | Leave button hidden/disabled for World League, or shows warning |

### Section C: Existing Users — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Migration adds existing users to World League** | Consistency across user base | One-time migration script enrolls all existing users |
| **C-2** | **Migration is idempotent** | Safe to re-run | Script handles users already in World League gracefully |

### Section D: Database — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **RLS allows self-enrollment in World League** | No permission errors | Users can insert their own membership for World League |
| **D-2** | **World League has "member" role by default** | Appropriate permissions | Auto-enrolled users have `role = 'member'` |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| New users auto-enrolled | 100% | Create test account, check memberships |
| World League in league list | Visible immediately | Visual inspection on new account |
| No duplicate memberships | 0 duplicates | Database query for duplicate entries |
| Existing users migrated | 100% | Count users vs World League members |

---

## 📅 Implementation Plan Reference

### Phase A: Auto-Enrollment
1. Update auth callback to create World League membership
2. Use admin client to bypass RLS if needed
3. Add error handling (log but don't fail)

### Phase B: UX Updates
1. Add welcome toast trigger (first dashboard visit after signup)
2. Update league list to show World League
3. Modify leave league logic to prevent/warn for World League

### Phase C: Migration
1. Write migration script to enroll existing users
2. Test on staging
3. Run on production

---

## 🔗 Related Documents

- [PRD 43: Nickname Identity](./PRD_43_Nickname_Primary_Identity.md) - Sets up the disclosure about global visibility
- [PRD 23: Global Leaderboard](./PRD_23_Global_Leaderboard.md) - The leaderboard they'll appear on
- [World League Migration](../../../supabase/migrations/20260106000000_create_world_league.sql) - World League definition

---

## Technical Notes

### World League Constants

```typescript
const WORLD_LEAGUE_ID = '00000000-0000-0000-0000-000000000001';
const WORLD_LEAGUE_INVITE_CODE = 'WORLD';
```

### Enrollment SQL Pattern

```sql
INSERT INTO memberships (league_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', :user_id, 'member')
ON CONFLICT (league_id, user_id) DO NOTHING;
```

---

## 🔍 Systems/Design Considerations

_Things to understand/investigate during implementation (not do immediately):_

1. **Auth Callback Timing** - Understand the exact sequence: user creation → profile sync → membership creation. Review `src/app/api/auth/callback/route.ts` to ensure World League enrollment doesn't race with profile creation. The user must exist in the `users` table before membership can be created.

2. **RLS Policy Review** - Verify that the existing `memberships` RLS policy allows users to insert their own membership for the World League specifically. Check `supabase/migrations/` for membership INSERT policies. May need a special case or use adminClient.

3. **Offline-First Impact** - Consider what happens if enrollment fails but user proceeds to dashboard. The dashboard should handle missing World League membership gracefully—show a "Join Global League" prompt rather than an error state.

---

## 💡 Proactive Considerations

_Forward-thinking items that anticipate future needs:_

1. **Enrollment Telemetry** - Add an analytics event for World League enrollment (`track('world_league_enrolled', { method: 'auto' | 'manual' })`). This helps measure signup → active user conversion and identify if auto-enrollment is working reliably.

2. **Opt-Out Consideration** - Design the enrollment as "default on" but consider future opt-out capability. Storing `auto_enrolled: boolean` in the membership record allows users to hide from the global leaderboard later without fully leaving. Schema: add `memberships.is_visible` column.

3. **Regional Leaderboards** - World League could spawn regional sub-views (World → Europe → UK) in the future. Consider adding a `region` column to users or a `region_tag` to memberships now. This prevents refactoring the membership model later when regional competitions are requested.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-20 | Initial | Created PRD for alpha launch requirement |
| 2026-01-20 | Systems/Proactive | Added modular design considerations and forward-thinking items |
