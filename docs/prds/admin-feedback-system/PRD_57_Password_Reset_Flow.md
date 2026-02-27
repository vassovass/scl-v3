# PRD 57: Password Reset Flow

> **Order:** 57
> **Status:** 📋 Proposed
> **Type:** Feature
> **Dependencies:** None
> **Blocks:** PRD 49 (Alpha Launch Checklist)

---

## 🎯 Objective

Allow users who forget their password to reset it without admin intervention. Currently, any user who forgets their password is permanently locked out — there is zero password recovery flow in the application.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/app/(auth)/sign-in/page.tsx` | Add "Forgot password?" link here |
| `src/app/(auth)/sign-up/page.tsx` | Reference pattern for auth page structure |
| `src/lib/supabase/client.ts` | Browser Supabase client for `resetPasswordForEmail` |
| `src/app/api/auth/callback/route.ts` | Auth callback handler — reset token arrives here |
| `src/components/providers/AuthProvider.tsx` | Handles `PASSWORD_RECOVERY` auth event |
| `src/app/(auth)/layout.tsx` | Auth page layout wrapper |
| `.claude/skills/auth-patterns/SKILL.md` | Auth patterns and best practices |
| `.claude/skills/form-components/SKILL.md` | Form input patterns with accessibility |
| `.claude/skills/supabase-patterns/SKILL.md` | Supabase client patterns, RLS |
| `.claude/skills/design-system/SKILL.md` | CSS variables, theming, shadcn/ui |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Verify auth schema, test resetPasswordForEmail flow |
| **Playwright MCP** | E2E test full password reset flow |
| **PostHog MCP** | Verify password reset funnel events |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit existing auth pages (`sign-in`, `sign-up`) for pattern reference |
| 2 | `[READ-ONLY]` | Check auth callback handler for existing event handling |
| 3 | `[WRITE]` | Create reset-password request page `[PARALLEL with Phase 4]` |
| 4 | `[WRITE]` | Create update-password page `[PARALLEL with Phase 3]` |
| 5 | `[WRITE]` | Add PASSWORD_RECOVERY handler to auth callback `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Write Vitest + Playwright tests `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Forgot Password Request — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **"Forgot password?" link visible on sign-in page** | Users can't discover the reset flow | Link below password field routes to `/reset-password` |
| **A-2** | **Reset password request page at `/reset-password`** | No UI to enter email for reset | Email input calls `resetPasswordForEmail()` with redirect URL |
| **A-3** | **Confirmation shown after request** | Users don't know to check email | "Check your email for a reset link" message after successful request |

### Section B: Password Update — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Update password page at `/update-password`** | No UI to set new password | New password + confirm password fields with validation |
| **B-2** | **Auth callback handles `recovery` event** | Reset token from email not processed | `PASSWORD_RECOVERY` event detected and user redirected to update page |
| **B-3** | **Success redirect to dashboard** | User left on dead-end page | After password update, redirect to `/dashboard` with success toast |

### Section C: Edge Cases — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Rate limit feedback for reset requests** | User spams reset button | Friendly message shown if Supabase returns rate limit error |
| **C-2** | **Expired reset link handled gracefully** | User clicks old email link | Clear message with option to request a new link |
| **C-3** | **Password strength validation** | Weak passwords accepted | Minimum 8 characters with visual strength indicator |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Reset email received | Within 60 seconds | Manual test with real email |
| Full flow completion | User signs in with new password | E2E test |
| Expired link handling | Clear message shown | Manual test with old link |
| Mobile usability | Works on mobile SA connection | Manual test on 4G |

---

## 📅 Implementation Plan Reference

### Phase 1: Core Flow
1. Create reset password request page
2. Add "Forgot password?" link to sign-in page
3. Create update password page
4. Handle `PASSWORD_RECOVERY` auth event in callback

### Phase 2: Polish
1. Add form validation and password strength indicator
2. Handle edge cases (expired links, rate limits)
3. Add success toasts and redirects

---

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add password reset flow to auth section
- [ ] `auth-patterns` skill — Add password reset pattern with PKCE flow
- [ ] CHANGELOG.md — Log password reset feature
- [ ] PRD_00_Index.md — Update PRD 57 status to ✅ Complete

## 🔗 Related Documents

- [Alpha Readiness Audit](../../ALPHA_READINESS_AUDIT.md) — BLOCKER 1
- [PRD 49: Alpha Launch Checklist](./PRD_49_Alpha_Launch_Checklist.md)
- [Auth Patterns Skill](../../../.agent/skills/auth-patterns/SKILL.md)
- [Form Components Skill](../../../.agent/skills/form-components/SKILL.md)

## 📚 Best Practice References

- **NIST 800-63B:** Min 8 chars, no forced complexity rules, never reveal if email exists
- **Supabase PKCE flow:** `resetPasswordForEmail()` sends magic link, `PASSWORD_RECOVERY` event emitted by `onAuthStateChange`
- **Rate limiting:** Supabase already rate limits to 1 email per 60s per address. Show friendly message on 429.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD from Alpha Readiness Audit |
