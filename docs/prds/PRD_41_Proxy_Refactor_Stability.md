# PRD 41: Proxy Refactor & Stability Hardening

> **Order:** 41  
> **Status:** 🟡 Planning  
> **Type:** Architecture / Refactor

---

## 🎯 Objective

To finalize the "Act As" system by **simplifying the core architecture**: A "Proxy" is no longer a special entity—it is just a **standard User** row that happens to be managed by another user. This unified model eliminates complex joins and special cases. Until claimed, this user is "ghost-managed"; after claiming, they become a fully independent user. Additionally, we are stabilizing the "Act As" experience with robust visibility controls and configurable limits.

---

## ⚠️ Agent Context & Documentation Strategy (Mandatory)

> **User Request:** "Agents must understand the 'Act As' pattern and specifically which files to reference."

### 1. AGENTS.md Context Injection & Reference Files

**Action:** Update "Auth Patterns" to document `isActingAsProxy`.

**Reference Files**: Agents should study these files to understand the state derivation:

| File | Purpose |
|------|---------|
| `src/components/providers/AuthProvider.tsx` | Core logic for **switchProfile** and `activeProfile` |
| `src/components/auth/ProfileSwitcher.tsx` | UI component handling the context switch |
| `src/lib/api/handler.ts` | How API routes extract the current acting user ID |
| `supabase/migrations/20260113143500_proxy_submissions_rls.sql` | The RLS policies enforcing "Act As" security |

### 2. `ARCHITECTURE.md` Update

**Action:** Add the "Unified User Model" diagram.

**Key Concept:** The `users` table is self-referential via `managed_by`. There is NO `proxy_members` table.

---

## 🏗️ Detailed Feature Requirements

### A. Unified Identity System (Proxy = User) — 5 Items

| # | Feature | Problem Solved | Implementation Outcome |
|---|---------|----------------|------------------------|
| **A-1** | **Simplified Schema** | Complex code handling "Members" vs "Users". | **Unified Model**: Drop `proxy_members` table. A Proxy is simply a User where `managed_by` is not null. It uses the exact same **id**, `metadata`, and `submissions` structure as a real user. |
| **A-2** | **"Act As" Switcher** | Managers confused about who they are submitting for. | **Global Context Switch**: **ProfileSwitcher** updates **AuthProvider** state. UI elements visually indicate Proxy context. |
| **A-3** | **Configurable Claiming** | Hardcoded limits inflexible for future use cases (e.g., families). | **Settings-Based Limit**: New setting `proxy_max_claims` (default: 1). When claimed, decrement count. If 0, remove `managed_by` and `is_proxy`. |
| **A-4** | **Strict Visibility** | Data leakage of ghost users. | **Manager-Only View**: RLS policies MUST ensure a proxy user is *only* visible to their specific `managed_by` Manager (and SuperAdmins). No public listing. |
| **A-5** | **Universal Creation** | Unclear who is allowed to use this feature. | **Default Access**: Any authenticated user (Member, Admin, Owner) can create proxies. Settings `proxy_creation_roles` can restrict this, but default is `["authenticated"]`. Guests (non-logged-in) cannot. |

### B. Submission & Interface Hardening — 3 Items

| # | Feature | Problem Solved | Implementation Outcome |
|---|---------|----------------|------------------------|
| **B-1** | **Sortable History** | Hard to find specific past submissions. | **Enhanced UX**: The "Recent Submissions" table MUST be sortable by all columns (Date, Steps, Status, Feedback) to help Managers quickly audit their proxy's data. |
| **B-2** | **Smart Retry Logic** | Flaky mobile submissions failing silently. | **Resilience**: Implement exponential backoff for image uploads and extraction APIs. |
| **B-3** | **Contextual Visibility** | Confusion seeing Proxy steps mixed with Own steps. | **Filtered Views**: **SubmitPage** respects "Act As" context. "My Submissions" ONLY shows the Active Profile's data. |

### C. Robustness & Optimization — 9 Items

| # | Feature | Problem Solved | Implementation Outcome |
|---|---------|----------------|------------------------|
| **C-1** | **Proxy RLS Caching** | Performance hit from complex RLS joins. | **Optimization**: Materialized view or index on `users(managed_by)` to speed up "My Proxies" queries. |
| **C-2** | **Safe Orphan Cleanup** | Database bloat/corruption if manager deleted. | **Stability (Soft Delete)**: DB Trigger: When Manager is `deleted_at`, also `soft_delete` their Unclaimed proxies. Avoids checking "is valid" for ghosts. |
| **C-3** | **Claim Rate Limiting** | Brute-force guessing of invite codes. | **Security**: Limit claim attempts to 5 per hour per IP. Exponential backoff on failed claims. |
| **C-4** | **Identity Audit Log** | "Who did this?" confusion in "Act As" mode. | **Traceability**: All writes made while `isActingAsProxy=true` logs the `real_user_id` in audit info. |
| **C-5** | **Context Persistence** | Reloading page resets you to "Real User". | **UX**: Persist `active_profile_id` in `localStorage` or `user_preferences`. On load, auto-switch back to the last active proxy. |
| **C-6** | **Cascading Accountability** | Managers creating abusive proxies to bypass bans. | **Security**: If a Proxy is banned for abuse, the System checks the Manager. Warning/Ban propagates UP to the creator. |
| **C-7** | **Active Quota System** | Free users creating 10,000 ghosts. | **Concurrent Limit**: SuperAdmin setting `max_proxies_per_user` (e.g., 50). API validates `count(managed_by) < Limit`. Important: **Claiming a proxy frees up a quota slot** for the manager. |
| **C-8** | **Smart Merging** | User claiming proxy loses their own profile pic/name. | **Data Integrity**: On claim, UI asks "Use Proxy Profile" or "Keep My Profile". Smartly merges metadata without overwriting constraints. |
| **C-9** | **Activity Decay** | "My Proxies" list cluttered with stale ghosts. | **Cleanup**: Proxies with 0 submissions > 6 months are auto-archived (hidden from dropdown but not deleted) to keep UI clean. |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| **Simplification** | 100% | No `proxy_members` table in schema. |
| **Usability** | Pass | Users can sort Submission History by "Steps" (Asc/Desc). |
| **Quota Release** | Pass | Claiming a proxy immediately allows the Manager to create 1 new one. |
| **Visibility** | 100% | Proxies visible ONLY to creator (RLS check). |

---

## 📅 Implementation Plan Reference

### Phase A: Core Logic (Unified Model)

1. **Refactor**: Apply `refactor_proxy_schema` to merge `proxy_members` into `users`.
2. **Context**: Implement **AuthProvider** switching with **Persistence**.
3. **Security**: Add RLS for `managed_by` and **Strict Visibility**.

### Phase B: Advanced Settings

1. Implement `max_proxies_per_user` (Active Quota).
2. Implement `proxy_max_claims` logic in Claim API.
3. Ensure `POST /api/proxies` defaults to allowing all authenticated users.

### Phase C: UX & Integrity

1. **UX**: Add Sortable Columns to `SubmissionTable`.
2. **Integrity**: Implement "Cascading Accountability" triggers.
3. **Flow**: Add "Smart Merging" UI to Claim flow.

---

## 🔗 Related Documents

- [Implementation Plan](../artifacts/plan_prd41_proxy_refactor.md)
- [Schema Migration Strategy](../artifacts/schema_prd41_migration.md)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-13 | Features | Added "Sortable History" requirement and emphasized "Unified User Model" |
| 2026-01-13 | Features | Defined "Active Quota" (claim releases slot) and "Universal Creation" default |
| 2026-01-13 | Robustness | Added 5 new items (Persistence, Accountability, Quotas, Merging, Decay) |
| 2026-01-13 | Features | Enhanced Role-Based Creation and Configurable Claim Counts |
| 2026-01-13 | Robustness | Refined Orphan Cleanup to use Soft Delete strategy |
| 2026-01-13 | Agent Context | Detailed file references for AI context injection |
| 2026-01-13 | Initial | Created PRD capturing post-f26771f features |
