# PRD 58: API Rate Limiting

> **Order:** 58
> **Status:** 🟡 Planning
> **Type:** Architecture
> **Priority:** HIGH — Should fix for alpha
> **Source:** Alpha Readiness Audit (BLOCKER 5)

## 🎯 Objective

Add rate limiting to API endpoints to prevent abuse, spam, and accidental double-submissions. Currently, zero rate limiting exists across all 75 API routes — any endpoint can be hammered without protection.

**Real scenario:** Alpha user accidentally double-submits steps (or intentionally spam-tests). No protection exists. Feedback endpoint can be flooded. Leaderboard queries can be hammered.

## ⚠️ Agent Context (Mandatory)

Study these files before implementing:
- `src/lib/api/handler.ts` — `withApiHandler` wrapper (add rate limiting here for centralized protection)
- `src/lib/api/index.ts` — API response helpers
- `src/app/api/submissions/route.ts` — High-value endpoint to protect
- `src/app/api/feedback/route.ts` — Public-facing endpoint to protect
- `src/app/api/auth/callback/route.ts` — Auth callback (protect against brute force)
- `next.config.js` — Rewrites configuration

## 🏗️ Detailed Feature Requirements

### Section A: Rate Limiting Infrastructure — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **In-memory rate limiter utility** | No rate limiting exists | Utility function that tracks requests per IP/user with sliding window |
| **A-2** | **Integration with `withApiHandler`** | Each route would need manual rate limiting | Optional `rateLimit` config in `HandlerConfig` (e.g., `{ windowMs: 60000, max: 10 }`) |
| **A-3** | **429 Too Many Requests response** | No standard rate limit response | Returns proper 429 with `Retry-After` header and user-friendly message |

### Section B: Endpoint Protection — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Submissions endpoint rate limited** | Double-submission of steps | Max 5 submissions per minute per user |
| **B-2** | **Feedback endpoint rate limited** | Feedback spam | Max 3 feedback items per minute per user |
| **B-3** | **Auth endpoints rate limited** | Brute force login attempts | Max 5 login attempts per minute per IP |
| **B-4** | **Share creation rate limited** | Share link spam / enumeration | Max 10 share links per minute per user |

### Section C: Future Considerations — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Upgrade path to Redis** | In-memory limits reset on deploy | Document Upstash Redis integration path for production |
| **C-2** | **Rate limit monitoring** | Can't see who hits limits | Log rate limit hits with user/IP for review |

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Submissions protected | Max 5/min per user | Automated test with rapid requests |
| 429 response format | Includes Retry-After header | Unit test |
| No false positives | Normal usage never hits limits | Manual test with typical alpha flow |
| Centralized | Works via `withApiHandler` config | Code review |

## 📅 Implementation Plan Reference

### Phase 1: Core (2 hours)
1. Create `src/lib/api/rateLimit.ts` with in-memory sliding window
2. Add `rateLimit` option to `withApiHandler` config
3. Return proper 429 responses

### Phase 2: Apply (1 hour)
1. Add rate limits to submissions, feedback, auth, and share routes
2. Test with rapid requests

### Phase 3: Production-ready (future)
1. Migrate to Upstash Redis for persistence across serverless instances
2. Add monitoring/alerting on rate limit hits

## 🔗 Related Documents
- [Alpha Readiness Audit](../ALPHA_READINESS_AUDIT.md) — BLOCKER 5
- [withApiHandler](../../src/lib/api/handler.ts) — Integration point

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | All | Initial PRD created from Alpha Readiness Audit |
