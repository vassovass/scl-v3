# PRD 57: Password Reset Flow

> **Order:** 57
> **Status:** 🟡 Planning
> **Type:** Feature
> **Priority:** BLOCKER — Must fix before alpha launch
> **Source:** Alpha Readiness Audit (BLOCKER 1)

## 🎯 Objective

Allow users who forget their password to reset it without admin intervention. Currently, any user who forgets their password is permanently locked out — there is zero password recovery flow in the application.

**Real scenario:** You invite 20 friends to alpha. 3 forget their password next week. They message you. You can't help them. They never come back.

## ⚠️ Agent Context (Mandatory)

Study these files before implementing:
- `src/app/(auth)/sign-in/page.tsx` — Current sign-in form (add "Forgot password?" link here)
- `src/app/(auth)/sign-up/page.tsx` — Sign-up flow for reference patterns
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/app/api/auth/callback/route.ts` — Auth callback handler (reset token arrives here)
- `src/components/providers/AuthProvider.tsx` — Auth state management
- `src/app/(auth)/layout.tsx` — Auth page layout wrapper

## 🏗️ Detailed Feature Requirements

### Section A: Forgot Password Request — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **"Forgot password?" link on sign-in page** | Users can't discover the reset flow | Link visible below password field, routes to `/reset-password` |
| **A-2** | **Reset password request page at `/reset-password`** | No UI to enter email for reset | Page with email input, calls `supabase.auth.resetPasswordForEmail()` with redirect URL |
| **A-3** | **Confirmation message after request** | Users don't know to check email | Shows "Check your email for a reset link" message after successful request |

### Section B: Password Update — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Update password page at `/update-password`** | No UI to set new password after clicking email link | Page with new password + confirm password fields |
| **B-2** | **Auth callback handles `recovery` event** | Reset token from email not processed | `onAuthStateChange` detects `PASSWORD_RECOVERY` event and redirects to update page |
| **B-3** | **Success redirect to dashboard** | User left on dead-end after password change | After successful update, redirect to `/dashboard` with success toast |

### Section C: Edge Cases — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Rate limit display for reset requests** | User spams reset button | Show friendly message if Supabase returns rate limit error |
| **C-2** | **Expired reset link handling** | User clicks old email link | Show clear message with option to request new link |
| **C-3** | **Password validation** | Weak passwords accepted | Minimum 8 characters, show strength indicator |

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Reset email received | Within 60 seconds | Manual test with real email |
| Full flow completion | User can sign in with new password | E2E test |
| Error handling | Expired links show clear message | Manual test with old link |
| Mobile usability | All pages work on mobile SA connection | Manual test on 4G |

## 📅 Implementation Plan Reference

### Phase 1: Core Flow (2-3 hours)
1. Create `/reset-password` page with email form
2. Add "Forgot password?" link to sign-in page
3. Create `/update-password` page with password form
4. Handle `PASSWORD_RECOVERY` auth event in callback

### Phase 2: Polish (1 hour)
1. Add form validation and password strength indicator
2. Handle edge cases (expired links, rate limits)
3. Add success toasts and redirects

## 🔗 Related Documents
- [Alpha Readiness Audit](../ALPHA_READINESS_AUDIT.md) — BLOCKER 1
- Supabase Auth: `resetPasswordForEmail()` API

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | All | Initial PRD created from Alpha Readiness Audit |
