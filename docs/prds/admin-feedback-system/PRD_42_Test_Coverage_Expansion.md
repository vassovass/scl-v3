# PRD 42: Test Coverage Expansion

> **Order:** 42
> **Status:** ✅ Complete
> **Type:** Architecture / Quality
> **Dependencies:** None (can start immediately)

---

## 🎯 Objective

Expand test coverage from ~6% to 70% across critical business logic, ensuring code reliability and enabling confident refactoring. Tests should catch regressions, verify business rules, and document expected behavior.

**Problem solved:** Untested code leads to bugs in production, fear of refactoring, and undocumented behavior. Critical paths (API routes, hooks, data processing) lack verification.

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Test configuration, coverage thresholds |
| `vitest.setup.ts` | Global mocks for Next.js modules |
| `src/__mocks__/supabase.ts` | Mock factories for Supabase client and data |
| `.agent/skills/testing-patterns/SKILL.md` | Test patterns and examples |
| `src/lib/__tests__/analytics.test.ts` | Example of comprehensive test file (632 lines) |

**Test Infrastructure Stack:**
- Vitest (test runner)
- React Testing Library (component testing)
- MSW (API mocking)
- jsdom (browser simulation)

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Verify mock factories match real schema |
| **Playwright MCP** | Cross-browser E2E tests (add Firefox, WebKit) |
| **PostHog MCP** | Verify analytics events in component tests |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit current coverage, identify untested critical paths |
| 2 | `[WRITE]` | Write API route tests (Phase A items) `[PARALLEL with Phase 3]` |
| 3 | `[WRITE]` | Write hook tests (Phase B items) `[PARALLEL with Phase 2]` |
| 4 | `[WRITE]` | Write utility tests (Phase C items) `[PARALLEL with Phase 2]` |
| 5 | `[WRITE]` | Write component tests (Phase D items) `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Centralize MSW handlers and test utilities (Phase E) `[SEQUENTIAL]` |
| 7 | `[WRITE]` | Add Firefox + WebKit to Playwright config `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Phase A: API Route Tests — 5 Priority Routes

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | `/api/admin/settings` route tested | Feature flags affect entire app, untested | Auth checks verified, CRUD operations tested, validation errors handled |
| **A-2** | `/api/submissions` route tested | Core submission logic untested | Create, read, conflict resolution tested with edge cases |
| **A-3** | `/api/leagues/[id]` routes tested | League management untested | CRUD, member management, authorization tested |
| **A-4** | `/api/high-fives` route tested | New engagement feature untested | Toggle behavior, duplicate prevention, error handling tested |
| **A-5** | `/api/admin/branding` route tested | Brand customization untested | Upload, validation, theme color tests |

### Phase B: Hook Tests — 8 Priority Hooks

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | `useFetch` hook tested | Data fetching logic untested | Loading, error, cache states verified |
| **B-2** | `usePreferences` hook tested | Settings persistence untested | Optimistic updates, rollback on error tested |
| **B-3** | `useFeatureFlag` hook tested | Flag evaluation untested | Default values, flag states verified |
| **B-4** | `useExport` hook tested | CSV export untested | File generation, column mapping, large data tested |
| **B-5** | `useImport` hook tested | CSV import untested | Parsing, validation, fuzzy matching tested |
| **B-6** | `useConflictCheck` hook tested | Duplicate detection untested | Detection accuracy verified |
| **B-7** | `useOfflineSync` hook tested | Background sync untested | Retry logic, queue management tested |
| **B-8** | `useSubmissionStatus` hook tested | Status tracking untested | State transitions verified |

### Phase C: Utility Tests — 4 Pure Logic Files

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | `csvParser.ts` tested | CSV parsing edge cases | Quoted fields, newlines, delimiters, encoding tested |
| **C-2** | `errors.ts` tested | Error normalization untested | All error types convert correctly |
| **C-3** | `badges.ts` tested | Badge logic untested | Assignment rules verified |
| **C-4** | `serverCache.ts` tested | Cache logic untested | TTL, invalidation tested |

### Phase D: Component Tests — 5 High-Value Components

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | `HighFiveButton` tested | User feature untested | Click handler, optimistic UI, analytics tracking verified |
| **D-2** | `SubmissionForm` tested | Core UX untested | Validation, submit flow, error display tested |
| **D-3** | `KanbanBoard` tested | Admin critical path untested | Drag-drop, status changes tested |
| **D-4** | `CookieConsent` tested | Legal feature untested | Consent flow verified |
| **D-5** | `ProfileSwitcher` tested | Auth UI untested | State management, switch behavior tested |

### Phase E: Infrastructure Improvements — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | Centralized MSW handlers | Mock duplication across tests | Single source of API mocks in `src/__mocks__/handlers.ts` |
| **E-2** | Test utility helpers | Repetitive setup code | `renderWithProviders`, `createAuthenticatedUser` helpers |
| **E-3** | Coverage reporting in CI | No visibility into coverage trends | Coverage report generated on PR, threshold enforced |

---

## ✅ Success Criteria

| Metric | Current | Target | Verification Method |
|--------|---------|--------|---------------------|
| Total tests | 320 | 500+ | `npm test` count |
| API routes tested | 4 | 25+ | Coverage report |
| Hooks tested | 2 | 15+ | Coverage report |
| Line coverage | ~6% | 70% | `npm run test:coverage` |
| Critical path coverage | 60% | 95% | Manual audit |

---

## 📅 Implementation Plan Reference

### Phase A: API Routes (First Priority)
1. Create test files for 5 priority routes
2. Test auth checks, validation, CRUD operations
3. Test error scenarios and edge cases

### Phase B: Hooks (Second Priority)
1. Test data-fetching hooks with loading/error states
2. Test state management hooks
3. Test export/import hooks with edge cases

### Phase C: Utilities (Third Priority)
1. Test pure logic functions
2. Focus on edge cases and error handling

### Phase D: Components (Fourth Priority)
1. Test high-value user-facing components
2. Test form validation and submission flows
3. Test admin components

### Phase E: Infrastructure (Ongoing)
1. Centralize mocks
2. Create test utilities
3. Set up CI coverage

---

## 🔗 Related Documents

- [testing-patterns skill](../../../.agent/skills/testing-patterns/SKILL.md) - Test patterns
- [AGENTS.md](../../../AGENTS.md) - Project patterns
- [vitest.config.ts](../../../vitest.config.ts) - Test configuration

---

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add test coverage requirements section
- [ ] `testing-patterns` skill — Add new mock patterns discovered during expansion
- [ ] CHANGELOG.md — Log test coverage milestone
- [ ] PRD_00_Index.md — Update PRD 42 status to ✅ Complete
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 42 — short description`

## 📚 Best Practice References

- **Coverage targets:** 70% line coverage overall, 95% for critical paths (auth, submissions, payments).
- **Mock strategy:** Centralize in `src/__mocks__/handlers.ts`. Never mock what you can test.
- **Cross-browser:** Add Firefox + WebKit projects to `playwright.config.ts` (PRD 61 dependency).
- **Test naming:** `describe('[Feature]')` → `it('should [behavior] when [condition]')`. Be descriptive.
- **MSW handlers:** Use `setupServer` for unit tests, `setupWorker` for integration. Match real API signatures.

---

## Proactive Items

| # | Item | Description | Trigger |
|---|------|-------------|---------|
| 1 | **Coverage trend tracking** | Add a CI step that records coverage % per commit to a JSON file, enabling a coverage-over-time chart on the admin dashboard | When CI pipeline is configured |
| 2 | **Snapshot testing for critical components** | Add Vitest snapshot tests for complex render output (KanbanBoard, SubmissionForm) to catch unintended UI regressions | When component architecture stabilizes |
| 3 | **Flaky test detection** | Add `vitest --retry=2` config and a flaky test report that flags tests needing stabilization | When test count exceeds 2000 |

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-28 | Complete | 113 new tests across 9 files: API routes, hooks, menu system sync |
| 2026-01-17 | Initial | Created PRD based on test coverage analysis |
