# PRD 65: Structured Logging & Health Check Endpoint

> **Order:** 65
> **Status:** 📋 Proposed
> **Type:** Architecture
> **Dependencies:** None (benefits from PRD 58 for rate limit logging)
> **Blocks:** None

---

## 🎯 Objective

Server-side logging is currently `console.error` with string interpolation. The `withApiHandler` catch block at `src/lib/api/handler.ts` line 267 does `console.error("[API Handler Error]", error)`. This is invisible in production unless someone manually checks Vercel logs. Before scaling past friends-and-family alpha (10+ users), operators need: (1) structured JSON logs that Vercel Log Drain can ingest, (2) a health check endpoint for uptime monitoring, and (3) request ID tracing for debugging user-reported issues.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/lib/api/handler.ts` | Core API handler, catch block at line 267 — replace console.error with structured logger. `HandlerConfig` interface at line 51 |
| `src/lib/errors.ts` | AppError class with error codes — structured logger should extract code, message, userId |
| `src/lib/supabase/server.ts` | Server-side Supabase client — used by health check to verify DB connectivity |
| `.agent/skills/api-handler/SKILL.md` | API handler patterns and conventions |
| `.agent/skills/error-handling/SKILL.md` | Error handling patterns |
| `.agent/skills/architecture-philosophy/SKILL.md` | Systems thinking, modular design |
| `AGENTS.md` | Project rules and patterns |

---

## 🔧 MCP Servers

| Server | Usage |
|--------|-------|
| **Supabase MCP** | Health check verifies DB connectivity, use to test |
| **Playwright MCP** | E2E test for `/api/health` endpoint |

---

## 🏗️ Detailed Feature Requirements

### Section A: Structured Logger — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **JSON structured logger utility created** | Server logs are unstructured strings | Logger outputs `{ timestamp, level, message, code, userId, requestId, duration }` JSON |
| **A-2** | **Logger replaces console.error in withApiHandler** | API errors invisible in production | All API handler catch blocks use structured logger |
| **A-3** | **Request ID generated per request** | Can't trace a user's error report to server logs | UUID request ID generated in handler, passed through context, included in error responses |

### Section B: Health Check — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **GET /api/health endpoint returns system status** | No way to check if app is healthy | Returns 200 with `{ status, database, auth_service, response_time_ms, timestamp }` |
| **B-2** | **Database connectivity check** | DB outage invisible until user complains | Health check pings Supabase, returns db status |
| **B-3** | **Auth service check** | Auth outage invisible | Health check verifies Supabase auth is reachable |

### Section C: Observability — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Rate limit events logged (when PRD 58 is done)** | Can't see who hits rate limits | Rate limit 429 responses logged with IP, endpoint, remaining count |
| **C-2** | **Request duration logged** | Can't identify slow endpoints | Handler logs `duration_ms` for every request |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Structured logs output valid JSON | All fields present in JSON output | Vitest parsing logger output |
| Health check returns 200 with correct shape | Response includes status, database, auth_service, response_time_ms, timestamp | Playwright E2E |
| Request ID appears in error responses | UUID format ID in response headers and body | Vitest mock request |
| Duration logged for all API requests | `duration_ms` field in every log entry | Vitest timing mock |
| Vercel Log Drain can parse structured logs | JSON format matches Vercel spec (one JSON object per line) | Verify JSON lines format |

---

## 🧪 Test Requirements

### Vitest
- Test structured logger outputs valid JSON with all required fields (timestamp, level, message, code, userId, requestId, duration)
- Test health check endpoint returns correct shape with db status
- Test request ID generation (UUID format, unique per request)
- Test duration logging for API requests

### Playwright
- E2E test calling `/api/health` and verifying 200 response with expected body shape

---

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add structured logging pattern, health check endpoint
- [ ] `api-handler` skill — Add logging config and request ID pattern
- [ ] `error-handling` skill — Reference structured logger for server-side errors
- [ ] CHANGELOG.md — Log structured logging addition
- [ ] PRD_00_Index.md — Update PRD 65 status
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 65 — short description`

---

## 📅 Implementation Plan Reference

### Phase 1: Core Logger
1. Create `src/lib/server/structuredLogger.ts` with JSON format

### Phase 2: Handler Integration
1. Replace `console.error` in `withApiHandler` with structured logger

### Phase 3: Request Tracing
1. Add request ID generation and context passing
2. Return `X-Request-ID` header in all API responses

### Phase 4: Health Check
1. Create `GET /api/health` endpoint with DB + auth checks

### Phase 5: Rate Limit Logging
1. Wire rate limit logging (after PRD 58)

---

## 🔀 Task-Optimized Structure

```
[READ-ONLY] Audit current logging patterns in handler.ts and other API files
[READ-ONLY] Check Vercel Log Drain JSON format specification
[WRITE] Create structured logger utility                    [PARALLEL with below]
[WRITE] Create /api/health endpoint                         [PARALLEL with above]
[WRITE] Integrate logger into withApiHandler                [SEQUENTIAL — needs logger]
[WRITE] Add request ID generation and context               [SEQUENTIAL — needs integration]
[WRITE] Write Vitest + Playwright tests
```

---

## 📚 Best Practice References

- **12-Factor App logging:** Treat logs as event streams, structured JSON, stdout
- **Vercel Log Drain:** Expects JSON lines format, one JSON object per line
- **Request ID:** RFC 7230 compliant, UUID v4, returned in `X-Request-ID` response header
- **Health check:** /health or /api/health, return 200 for healthy, 503 for degraded, include component status

---

## 🔗 Related Documents

- [Alpha Readiness Audit](../../ALPHA_READINESS_AUDIT.md)
- [API Handler Skill](../../../.agent/skills/api-handler/SKILL.md)
- [Error Handling Skill](../../../.agent/skills/error-handling/SKILL.md)
- [PRD 58: Rate Limiting](./PRD_58_Rate_Limiting.md) — For rate limit event logging

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD — proactive addition from sprint reorganization |

---

**Effort estimate:** 2-3 hours
