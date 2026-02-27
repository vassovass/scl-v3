# Alpha Testing Checklist

> **Purpose:** Manual + automated testing checklist before inviting alpha testers
> **Date:** 2026-02-27
> **Target:** Friends & family in South Africa

---

## Pre-Flight: Run These Before Inviting Anyone

### Automated Tests
```bash
# 1. Type check (catches compile errors)
npx tsc --noEmit

# 2. Unit tests (catches logic errors)
npm test

# 3. E2E against production (catches integration errors)
PLAYWRIGHT_BASE_URL=https://stepleague.app npx playwright test

# 4. E2E alpha stability tests specifically
PLAYWRIGHT_BASE_URL=https://stepleague.app npx playwright test alpha-stability

# 5. E2E with Firefox (catches browser-specific errors like January 2026)
# Uncomment Firefox in playwright.config.ts first
PLAYWRIGHT_BASE_URL=https://stepleague.app npx playwright test --project=firefox
```

### Build Verification
```bash
# Full production build (catches SSR errors, missing imports)
npm run build
# Should exit 0 with ~90 pages
```

---

## Manual Testing Checklist

### Critical Path: New User Sign-Up (Test This First)

- [ ] Open https://stepleague.app in **Chrome incognito**
- [ ] Homepage loads within 5 seconds
- [ ] "Get Started Free" button navigates to /sign-up
- [ ] Sign up with email + password works
- [ ] Email confirmation email is received
- [ ] Clicking email link logs user in
- [ ] Dashboard loads with welcome toast
- [ ] No errors in browser console (F12 → Console)

### Critical Path: New User Sign-Up (Firefox)

- [ ] Open https://stepleague.app in **Firefox private window**
- [ ] Homepage loads (no white screen)
- [ ] Sign-up form renders correctly
- [ ] No "The operation is insecure" errors in console
- [ ] Login works after sign-up

### Critical Path: New User Sign-Up (Mobile)

- [ ] Open https://stepleague.app on **mobile phone browser**
- [ ] Homepage is responsive (no horizontal scroll)
- [ ] Sign-up form is usable on mobile
- [ ] Keyboard doesn't cover form fields
- [ ] Login works on mobile

### Critical Path: New User Sign-Up (WhatsApp In-App Browser)

- [ ] Send yourself the link via WhatsApp
- [ ] Open in WhatsApp's built-in browser
- [ ] Homepage renders (not white screen)
- [ ] Sign-in page renders (no SecurityError)

### Post-Login Experience

- [ ] Dashboard shows "Welcome to World League!" toast
- [ ] Dashboard empty state is clear
- [ ] "Create League" button works
- [ ] "Join League" (with code) works
- [ ] Navigate to Submit Steps page
- [ ] Upload a screenshot image
- [ ] AI extraction runs (verify loading state shows)
- [ ] Submission appears on leaderboard

### League Flow

- [ ] Create a new league
- [ ] Copy invite link
- [ ] Share invite link (via WhatsApp)
- [ ] Second user can join via invite link
- [ ] Leaderboard shows both users
- [ ] High-five button works

### Error Recovery

- [ ] Navigate to /reset — should clear state and redirect to sign-in
- [ ] Navigate to /dashboard without login — should redirect to sign-in
- [ ] Navigate to /league/invalid-uuid — should handle gracefully
- [ ] Navigate to /nonexistent-page — should show 404

### Analytics Verification (After All Above)

- [ ] Open PostHog dashboard — check for events from test user
- [ ] Check `sign_up` event fired
- [ ] Check `login` event fired
- [ ] Check `league_created` event fired (if tested)
- [ ] Check `steps_submitted` event fired (if tested)
- [ ] Open GA4 Realtime — check for events appearing

---

## Device Matrix (Minimum for Alpha)

| Device | Browser | Priority | Status |
|--------|---------|----------|--------|
| Desktop | Chrome | P0 | [ ] |
| Desktop | Firefox | P0 | [ ] |
| Desktop | Safari | P1 | [ ] |
| iPhone | Safari | P0 | [ ] |
| Android | Chrome | P0 | [ ] |
| Any | WhatsApp in-app | P1 | [ ] |
| Any | Instagram in-app | P2 | [ ] |
| Any | Incognito/Private mode | P0 | [ ] |

---

## Known Issues (Document for Alpha Testers)

### Things That Are Expected
- Page loads may take 2-4 seconds (servers are in US/Singapore, users in South Africa)
- Dark mode is the only fully supported theme currently
- Some pages show loading spinners for 1-2 seconds
- The cookie consent banner appears on first visit

### Things That Need Fixing Before Alpha
- [ ] **BLOCKER:** No password reset flow — if you forget your password, you're stuck
- [ ] **BLOCKER:** Agent API endpoints have no authentication
- [ ] **HIGH:** Analytics don't identify users (PostHog will show anonymous sessions)
- [ ] **HIGH:** Cookie consent is decorative (tracking fires regardless)
- [ ] **MEDIUM:** No rate limiting on API endpoints

---

## Post-Alpha Feedback Collection

### Ask Testers
1. Did sign-up work on the first try? If not, what happened?
2. Did you understand what to do after landing on the dashboard?
3. Were you able to submit your steps? How long did it take?
4. Did you experience any errors or white screens?
5. How did the speed feel? (Fast/OK/Slow/Unusable)
6. What device and browser were you using?

### Monitor
- PostHog session recordings (if consent is fixed)
- GA4 realtime events
- Supabase logs for API errors
- Vercel function logs for server errors
- Feedback widget submissions

---

## Quick Reference: Test Accounts

Set these in `.env.local` for Playwright:
```
SL_PW_LOGIN_TEST_USERNAME=your-test-email@example.com
SL_PW_LOGIN_TEST_PASSWORD=your-test-password
```

Set `PLAYWRIGHT_BASE_URL=https://stepleague.app` to test against production.

---

*Last updated: 2026-02-27*
