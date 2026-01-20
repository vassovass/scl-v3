# PRD 43: Nickname as Primary Identity

> **Order:** 43
> **Status:** 📋 Proposed
> **Type:** Refactor
> **Dependencies:** None
> **Blocks:** PRD 44 (World League Auto-Enroll), PRD 49 (Alpha Launch)

---

## 🎯 Objective

Unify the user identity model by establishing a single "Nickname" field as the primary public-facing identity displayed on all leaderboards. Users must understand at signup that their chosen name will be visible globally. This change consolidates the existing dual `display_name`/`nickname` system and ensures consistency across all user touchpoints including the proxy claim flow.

**Problem Solved:**
1. Users set "Display Name" at signup without understanding global visibility
2. Separate optional "Nickname" in profile settings causes confusion
3. Proxy claim flow references "display_name" but leaderboard may show "nickname"
4. No disclosure about Global Leaderboard visibility during signup

---

## ⚠️ Agent Context (MANDATORY)

Before implementing, study these files to understand current usage:

| File | Purpose | Current Behavior |
|------|---------|------------------|
| `src/app/(auth)/sign-up/page.tsx` | Signup form | Has "Display Name" field, no visibility disclosure |
| `src/app/settings/profile/page.tsx` | Profile settings | Has BOTH display_name AND nickname fields |
| `src/app/(auth)/claim/[code]/page.tsx` | Proxy claim UI | Offers "keep proxy's display name" vs "keep my profile" |
| `src/app/api/proxy-claim/[code]/route.ts` | Proxy claim API | Updates `display_name` based on merge strategy |
| `src/app/api/profile/route.ts` | Profile API | Handles both fields separately |
| `src/app/api/leaderboard/route.ts` | Leaderboard API | Returns both `display_name` and `nickname` |
| `src/types/database.ts` | Type definitions | Both fields defined in users table |
| `src/components/providers/AuthProvider.tsx` | Auth context | Exposes `userProfile` with both fields |

**Critical Pattern to Follow:**
- The leaderboard currently uses `nickname || display_name` fallback
- Proxy members use `display_name` (no nickname set)
- 49 files reference these fields (see grep results)

**Related Skills:**
- `form-components` - Form validation patterns
- `auth-patterns` - Authentication flow patterns
- `supabase-patterns` - Database operations

---

## 🏗️ Detailed Feature Requirements

### Section A: Signup Flow — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Users enter a "Nickname" at signup** | Single identity field clarity | Signup form label reads "Nickname" (not "Display Name") |
| **A-2** | **Global visibility disclosure visible at signup** | Transparency about leaderboard appearance | Text below field: "This will be shown on the Global Leaderboard and is visible to all users" |
| **A-3** | **Nickname validation: 2-30 characters** | Prevent abuse and display issues | Form rejects names outside range with clear error |
| **A-4** | **Nickname stored in `display_name` column** | Backward compatibility | Database uses existing `display_name` column (no schema migration) |
| **A-5** | **Signup succeeds only with valid nickname** | Required field enforcement | Cannot proceed without entering valid nickname |

### Section B: Profile Settings — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Single "Nickname" field in profile settings** | Eliminate dual-field confusion | Profile page shows ONE editable name field labeled "Nickname" |
| **B-2** | **Global visibility reminder in settings** | Reinforce public nature | Same disclosure text as signup visible in settings |
| **B-3** | **Separate `nickname` column deprecated** | Clean data model | Code comments mark `nickname` column as deprecated, use `display_name` |
| **B-4** | **Nickname changes reflected immediately** | Real-time updates | Editing nickname updates leaderboard appearance without delay |

### Section C: Proxy Claim Flow — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Claim page shows proxy's nickname** | Consistent terminology | UI says "Profile Nickname" not "Profile Name" or "Display Name" |
| **C-2** | **Merge strategy uses "nickname" terminology** | User understanding | Options read "Use [proxy nickname]" and "Keep my nickname" |
| **C-3** | **Claimed user prompted to review nickname** | Post-claim confirmation | Redirect to profile settings with message about reviewing nickname |
| **C-4** | **Global visibility disclosure on claim completion** | Awareness of leaderboard | Toast or banner: "Your nickname is now visible on the Global Leaderboard" |
| **C-5** | **Proxy creation uses "nickname" terminology** | Consistency in admin flows | When creating proxies, field labeled "Nickname" |

### Section D: Leaderboard Display — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Leaderboard shows `display_name` as nickname** | Consistent display | All leaderboard entries show the user's nickname |
| **D-2** | **Fallback for empty nicknames** | Edge case handling | If somehow empty, show "Anonymous #[id_suffix]" |
| **D-3** | **API response uses consistent field name** | Developer clarity | Leaderboard API returns `nickname` field (sourced from `display_name`) |

### Section E: Codebase Audit — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | **All UI references updated** | No "Display Name" labels remain | Search codebase: no user-facing "Display Name" strings |
| **E-2** | **All API responses consistent** | Developer experience | APIs return `nickname` (or clearly document `display_name` is nickname) |
| **E-3** | **Test files updated** | Test accuracy | Tests reference "nickname" not "display_name" where user-facing |
| **E-4** | **No functionality breaks** | Regression prevention | All existing features work: signup, profile, claim, leaderboard, proxy management |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Signup shows "Nickname" label | 100% | Visual inspection of signup page |
| Global visibility disclosure present | At signup AND profile | Visual inspection |
| Proxy claim uses "nickname" terminology | All text | Review claim page UI |
| Leaderboard displays nicknames correctly | All users | Test with multiple accounts |
| No "Display Name" in user-facing UI | 0 occurrences | Grep search |
| All existing tests pass | 100% | `npm test` |
| TypeScript compiles | 0 errors | `npx tsc --noEmit` |

---

## 📋 Files Requiring Changes (Audit List)

Based on grep for `display_name|nickname`, these files need review:

**High Priority (User-Facing):**
- `src/app/(auth)/sign-up/page.tsx` - Signup form
- `src/app/settings/profile/page.tsx` - Profile settings
- `src/app/(auth)/claim/[code]/page.tsx` - Claim UI
- `src/components/league/ProxyMemberManagement.tsx` - Proxy creation
- `src/components/forms/ProxySubmissionSection.tsx` - Proxy dropdown

**API Routes:**
- `src/app/api/profile/route.ts` - Profile CRUD
- `src/app/api/proxy-claim/[code]/route.ts` - Claim logic
- `src/app/api/leaderboard/route.ts` - Leaderboard response
- `src/app/api/proxies/route.ts` - Proxy management

**Components:**
- `src/components/providers/AuthProvider.tsx` - User profile context
- `src/components/auth/ProfileSwitcher.tsx` - Profile display
- `src/components/navigation/NavHeader.tsx` - User name display

**Types:**
- `src/types/database.ts` - Add deprecation comments

---

## 📅 Implementation Plan Reference

### Phase A: Signup & Validation
1. Update signup form label to "Nickname"
2. Add global visibility disclosure text
3. Implement 2-30 character validation
4. Update error messages

### Phase B: Profile Settings
1. Consolidate to single "Nickname" field
2. Add visibility disclosure
3. Deprecate separate nickname field handling

### Phase C: Proxy Flow
1. Update claim page terminology
2. Update proxy creation terminology
3. Add post-claim disclosure toast

### Phase D: Leaderboard & API
1. Ensure consistent display
2. Add fallback for empty names
3. Update API response field names if needed

### Phase E: Audit & Testing
1. Search and replace user-facing "Display Name" strings
2. Update test files
3. Run full test suite
4. Manual QA of all flows

---

## 🔗 Related Documents

- [PRD 41: Proxy Refactor](../PRD_41_Proxy_Refactor_Stability.md) - Proxy claim system
- [PRD 44: Auto-Enroll World League](./PRD_44_Auto_Enroll_World_League.md) - Depends on nickname being set
- [PRD 23: Global Leaderboard](./PRD_23_Global_Leaderboard.md) - Where nickname is displayed
- [AGENTS.md](../../../AGENTS.md) - Project patterns

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing user data | High | Use existing `display_name` column, no migration needed |
| Proxy claim flow regression | High | Comprehensive testing of claim flow before/after |
| API consumers expecting `display_name` | Medium | Keep `display_name` in API responses, add `nickname` alias |
| Empty nickname edge cases | Low | Implement fallback display |

---

## 🔍 Systems/Design Considerations

_Things to understand/investigate during implementation (not do immediately):_

1. **Proxy/Claim Flow Impact** - Understand how nickname changes affect the claim flow; ensure claimed users' nicknames display correctly post-claim. Review `src/app/(auth)/claim/[code]/page.tsx` and `src/app/api/proxy-claim/[code]/route.ts` to understand the current merge strategies.

2. **AuthProvider Context** - Review how `userProfile` in `src/components/providers/AuthProvider.tsx` exposes nickname; ensure real-time updates propagate to all consuming components (NavHeader, ProfileSwitcher, LeaderboardTable).

3. **API Response Consistency** - Decide whether APIs return `display_name`, `nickname`, or both; document the canonical field name in AGENTS.md. The leaderboard currently uses `nickname || display_name` fallback—determine if this pattern should persist.

4. **Test Suite Terminology** - Check if test assertions use "display_name" strings that need updating for semantic accuracy. 49 files currently reference these fields; not all need changing, but user-facing tests should reflect the new terminology.

---

## 💡 Proactive Considerations

_Forward-thinking items that anticipate future needs:_

1. **Nickname Uniqueness Strategy** - Consider whether to enforce unique nicknames in the future. If so, add a case-insensitive unique index NOW (even if not enforced) to avoid painful migrations later. This prevents two users from claiming "Champion" and "champion" before uniqueness matters.

2. **Nickname History/Audit** - Consider logging nickname changes for abuse prevention. A simple `nickname_history` table could help identify users who change names frequently to evade moderation or exploit leaderboard visibility. Schema: `(user_id, old_nickname, new_nickname, changed_at)`.

3. **Offensive Name Filtering** - Plan for a profanity filter or review system. Even a simple word blocklist prevents embarrassing leaderboard displays at alpha launch. Consider a lightweight library like `bad-words` or a server-side check against a configurable word list.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-20 | Initial | Created PRD |
| 2026-01-20 | Section C | Added proxy claim flow requirements per user feedback |
| 2026-01-20 | Agent Context | Added 49 files audit note |
