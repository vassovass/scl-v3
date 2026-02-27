# PRD 58: API Rate Limiting

> **Order:** 58
> **Status:** 📋 Proposed
> **Type:** Architecture
> **Dependencies:** None
> **Blocks:** None

---

## 🎯 Objective

Protect API endpoints from abuse, spam, and accidental double-submissions. Currently, zero rate limiting exists across all 75 API routes — any endpoint can be hammered without protection.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/lib/api/handler.ts` | `withApiHandler` wrapper — add rate limiting config here |
| `src/lib/api/index.ts` | API response helpers — add 429 response here |
| `src/app/api/submissions/route.ts` | High-value endpoint to protect first |
| `src/app/api/feedback/route.ts` | Public-facing endpoint to protect |
| `src/app/api/share/create/route.ts` | Share creation — prevent enumeration |
| `.claude/skills/api-handler/SKILL.md` | API handler patterns and conventions |
| `.claude/skills/error-handling/SKILL.md` | Error handling and AppError patterns |
| `.claude/skills/architecture-philosophy/SKILL.md` | Modular design, systems thinking |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Verify API route patterns and schema |
| **Playwright MCP** | E2E test rapid request → 429 response |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit `withApiHandler` interface for rate limit config injection point |
| 2 | `[READ-ONLY]` | Identify priority endpoints across 75 API routes |
| 3 | `[WRITE]` | Create rate limiter utility `[PARALLEL with Phase 4]` |
| 4 | `[WRITE]` | Add `rateLimit` config to `HandlerConfig` `[PARALLEL with Phase 3]` |
| 5 | `[WRITE]` | Apply to priority endpoints `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Write Vitest + Playwright tests `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Rate Limiting Infrastructure — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Rate limiter utility created** | No rate limiting exists | Sliding window tracker per IP/user, configurable limits |
| **A-2** | **Integrated with `withApiHandler`** | Each route would need manual rate limiting | Optional `rateLimit` config in `HandlerConfig` |
| **A-3** | **Standard 429 response** | No rate limit response format | Returns 429 with `Retry-After` header and user-friendly message |

### Section B: Endpoint Protection — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Submissions endpoint protected** | Double-submission of steps | Max 5 submissions per minute per user |
| **B-2** | **Feedback endpoint protected** | Feedback spam | Max 3 feedback items per minute per user |
| **B-3** | **Auth endpoints protected** | Brute force login attempts | Max 5 login attempts per minute per IP |
| **B-4** | **Share creation protected** | Share link spam / enumeration | Max 10 share links per minute per user |

### Section C: Future Considerations — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Upgrade path documented** | In-memory limits reset on deploy | Redis integration path documented for production |
| **C-2** | **Rate limit hits logged** | Can't see who hits limits | Log events with user/IP for monitoring |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Submissions protected | Max 5/min enforced | Automated test with rapid requests |
| 429 response format | Includes Retry-After header | Unit test |
| No false positives | Normal usage never hits limits | Manual test with typical alpha flow |
| Centralized config | Works via `withApiHandler` config | Code review |

---

## 📅 Implementation Plan Reference

### Phase 1: Core
1. Create rate limiter utility with sliding window
2. Add `rateLimit` option to `withApiHandler`
3. Implement 429 response format

### Phase 2: Apply
1. Add rate limits to high-priority endpoints
2. Verify with rapid-request tests

---

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add rate limiting pattern to API section
- [ ] `api-handler` skill — Add `rateLimit` config example
- [ ] CHANGELOG.md — Log rate limiting addition
- [ ] PRD_00_Index.md — Update PRD 58 status to ✅ Complete

## 📚 Best Practice References

- **RFC 6585:** Standard 429 Too Many Requests with `Retry-After` header
- **Sliding window algorithm:** Best balance of accuracy vs memory. Fixed window has burst issues at boundaries.
- **Vercel caveat:** Serverless = stateless. In-memory limits reset on cold start. Acceptable for alpha. Document Upstash Redis upgrade for production.
- **Headers:** Include `X-RateLimit-Remaining` and `X-RateLimit-Limit` alongside `Retry-After`

## 🔗 Related Documents

- [Alpha Readiness Audit](../../ALPHA_READINESS_AUDIT.md) — BLOCKER 5
- [API Handler Skill](../../../.agent/skills/api-handler/SKILL.md)
- [PRD 65: Structured Logging](./PRD_65_Structured_Logging.md) — Rate limit events feed into logging

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD from Alpha Readiness Audit |
