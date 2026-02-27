# PRD 62: Security Headers & CSP Configuration

> **Order:** 62
> **Status:** 📋 Proposed
> **Type:** Architecture
> **Dependencies:** None
> **Blocks:** None (but should be done before any public launch)

---

## 🎯 Objective

Zero security headers exist in production. `vercel.json` only contains `{ "regions": ["lhr1"] }`. No Content-Security-Policy, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy. OWASP lists missing security headers as a baseline vulnerability. For a health-related app handling user data in South Africa (POPIA compliance), this is non-negotiable before public launch.

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `vercel.json` | Add `headers` array alongside existing `regions` |
| `next.config.js` | Alternative location for headers config |
| `src/lib/api/handler.ts` | Verify API routes also receive headers |
| `.claude/skills/middleware-patterns/SKILL.md` | Middleware patterns |
| `.claude/skills/api-handler/SKILL.md` | API handler patterns |
| `AGENTS.md` | Project rules and patterns |

### MCP Servers

- **Playwright MCP** — Verify response headers in E2E tests

---

## 🏗️ Detailed Feature Requirements

### Section A: Core Security Headers — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Content-Security-Policy header present on all responses** | Prevents XSS, clickjacking via script injection | CSP header in response, verified via Playwright |
| **A-2** | **X-Frame-Options: DENY** | Prevents clickjacking by embedding site in iframes | Header present, iframe embed blocked |
| **A-3** | **Strict-Transport-Security (HSTS)** | Forces HTTPS, prevents downgrade attacks | `max-age=31536000; includeSubDomains` in header |
| **A-4** | **X-Content-Type-Options: nosniff** | Prevents MIME-type sniffing attacks | Header present in response |
| **A-5** | **Referrer-Policy: strict-origin-when-cross-origin** | Controls referrer data leakage | Header present, verified via response check |
| **A-6** | **Permissions-Policy** | Disables unnecessary browser APIs (camera, mic, geolocation) | Header disables unused permissions |

### Section B: CSP Tuning — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **CSP allows required domains (Supabase, PostHog proxy, GTM proxy)** | Analytics and DB connections not blocked by CSP | All proxied analytics and Supabase requests succeed |
| **B-2** | **CSP documented for future additions** | New services don't know which CSP directives to add | CSP configuration documented in AGENTS.md |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| All 6 security headers present on homepage response | Headers in response | Playwright E2E |
| All 6 headers present on API route responses | Headers in response | Playwright E2E |
| No broken functionality (analytics, Supabase, images still load) | Zero regressions | Manual smoke test |
| OWASP headers checklist passes | All checks green | securityheaders.com after deploy |

---

## 🧪 Test Requirements

- **Vitest:** Test headers configuration object contains all required keys and values
- **Playwright:** E2E test checking response headers on homepage, dashboard, and one API route

---

## 📝 Documentation Update Checklist

- [ ] AGENTS.md — Add security headers section
- [ ] CHANGELOG.md — Log security headers addition
- [ ] PRD_00_Index.md — Update PRD 62 status
- [ ] `middleware-patterns` skill — Add CSP pattern if relevant

---

## 📅 Implementation Plan Reference

### Phase 1: Add Headers
1. Add security headers configuration to `vercel.json` (or `next.config.js`)

### Phase 2: CSP Tuning
1. Tune CSP directives for Supabase, PostHog proxy, GTM proxy
2. Verify all existing functionality still works

### Phase 3: Verification
1. Test with Playwright E2E
2. Validate with securityheaders.com

---

## 🔧 Task-Optimized Structure

| Mode | Task |
|------|------|
| `[READ-ONLY]` | Audit current `vercel.json` and `next.config.js` for existing header config |
| `[READ-ONLY]` | Check analytics proxy paths in `next.config.js` rewrites for CSP allowlist |
| `[WRITE]` | Add security headers configuration |
| `[WRITE]` | Write Vitest + Playwright tests |

---

## 📚 Best Practice References

- **OWASP Secure Headers Project:** https://owasp.org/www-project-secure-headers/
- **CSP starting point:** `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.supabase.co; connect-src 'self' *.supabase.co *.posthog.com; font-src 'self' data:`
- Iterate to remove `unsafe-eval` and `unsafe-inline` over time

---

## 🔗 Related Documents

- [Alpha Readiness Audit](../../ALPHA_READINESS_AUDIT.md)
- [Middleware Patterns Skill](../../../.agent/skills/middleware-patterns/SKILL.md)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD — proactive addition from sprint reorganization |

---

**Effort estimate:** 1-2 hours
