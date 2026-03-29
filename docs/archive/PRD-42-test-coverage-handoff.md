# PRD 42 - Test Coverage Expansion: LLM Handoff Document

## Current Status (2026-01-18)

**Total Tests: 1,101 passing** | **TypeScript: 0 errors** | **Phases A-D: Complete**

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase A: API Routes** | ✅ Complete | 5/5 routes tested (231 tests) |
| **Phase B: Hook Tests** | ✅ Complete | 8/8 hooks tested (315 tests) |
| **Phase C: Utility Tests** | ✅ Complete | 4/4 files tested (208 tests) |
| **Phase D: Components** | ✅ Complete | 5/5 components tested |
| **TypeScript Errors** | ✅ Fixed | 127 errors → 0 errors |
| **Phase E: Infrastructure** | ⏳ Pending | MSW handlers, test utilities |

---

## Agent Workflow

### Roles

| Agent | Responsibility |
|-------|---------------|
| **Claude Code** | Primary implementation, feature development, bug fixes |
| **Antigravity** | Code review, architecture, complex refactoring |
| **Codex** | Test creation for code changes |

### Codex Test Creation Workflow

When Claude Code or Antigravity makes code changes, Codex creates corresponding tests.

**Trigger:** Any code change to:
- `src/app/api/**/*.ts` → Create/update `__tests__/route.test.ts`
- `src/hooks/*.ts` → Create/update `__tests__/[hook].test.ts`
- `src/lib/**/*.ts` → Create/update `__tests__/[file].test.ts`
- `src/components/**/*.tsx` → Create/update `__tests__/[Component].test.tsx`

**Codex Instructions:**

1. **Read the changed file** - Understand what was added/modified
2. **Read existing tests** - Check if `__tests__/` folder exists for that file
3. **Follow testing-patterns skill** - See `.agent/skills/testing-patterns/SKILL.md`
4. **Use existing patterns** - Look at similar test files for structure
5. **Run tests** - Verify with `npm test`
6. **Check TypeScript** - Run `npx tsc --noEmit`

---

## TypeScript Patterns for Tests

When creating tests, use these patterns to avoid TypeScript errors:

### Pattern A: Nullable Types
```typescript
// DON'T: TypeScript narrows this to literal null
const membership: { role: Role } | null = null;

// DO: Type assertion preserves the union type
const membership = null as { role: Role } | null;
```

### Pattern B: Optional Function Types
```typescript
// DON'T: TypeScript narrows to never
const transform: ((data: T) => U) | undefined = undefined;

// DO: Type assertion preserves function type
const transform = undefined as ((data: T) => U) | undefined;
```

### Pattern C: Always Import Vitest
```typescript
// Every test file needs this
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

---

## Test Structure Reference

### API Route Test Template
```typescript
import { describe, it, expect } from 'vitest';

describe('API Route - [Name]', () => {
    describe('Authorization', () => {
        it('requires authentication', () => { /* ... */ });
        it('allows authorized users', () => { /* ... */ });
    });

    describe('Validation', () => {
        it('validates required fields', () => { /* ... */ });
    });

    describe('Business Logic', () => {
        it('performs expected operation', () => { /* ... */ });
    });

    describe('Edge Cases', () => {
        it('handles errors gracefully', () => { /* ... */ });
    });
});
```

### Hook Test Template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('[hookName]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Initial state', () => {
        it('returns expected defaults', () => { /* ... */ });
    });

    describe('State updates', () => {
        it('updates on action', () => { /* ... */ });
    });

    describe('Error handling', () => {
        it('handles failures', () => { /* ... */ });
    });
});
```

---

## Test Files Reference

### Phase A: API Routes
```
src/app/api/submissions/__tests__/route.test.ts       (98 tests)
src/app/api/admin/settings/__tests__/route.test.ts   (16 tests)
src/app/api/leagues/[id]/__tests__/route.test.ts     (52 tests)
src/app/api/high-fives/__tests__/route.test.ts       (29 tests)
src/app/api/admin/branding/__tests__/route.test.ts   (36 tests)
```

### Phase B: Hooks
```
src/hooks/__tests__/useFetch.test.ts            (38 tests)
src/hooks/__tests__/useFeatureFlag.test.ts      (27 tests)
src/hooks/__tests__/useConflictCheck.test.ts    (38 tests)
src/hooks/__tests__/useExport.test.ts           (47 tests)
src/hooks/__tests__/useSubmissionStatus.test.ts (41 tests)
src/hooks/__tests__/usePreferences.test.ts      (35 tests)
src/hooks/__tests__/useImport.test.ts           (46 tests)
src/hooks/__tests__/useOfflineSync.test.ts      (43 tests)
```

### Phase C: Utilities
```
src/lib/export/__tests__/csvParser.test.ts      (41 tests)
src/lib/__tests__/errors.test.ts                (45 tests)
src/lib/__tests__/badges.test.ts                (73 tests)
src/lib/cache/__tests__/serverCache.test.ts     (49 tests)
```

### Phase D: Components
```
src/components/encouragement/__tests__/HighFiveButton.test.tsx
src/components/forms/__tests__/SubmissionForm.test.tsx
src/components/analytics/__tests__/CookieConsent.test.tsx
src/components/auth/__tests__/ProfileSwitcher.test.tsx
src/components/admin/__tests__/KanbanBoard.test.tsx
```

---

## What Remains: Phase E Infrastructure

| Task | File to Create | Purpose |
|------|----------------|---------|
| E-1 | `src/__mocks__/handlers.ts` | Centralized MSW handlers |
| E-2 | `src/__tests__/utils.tsx` | `renderWithProviders`, `createAuthenticatedUser` |
| E-3 | `.github/workflows/test.yml` | CI coverage reporting |

---

## Commands

```bash
# Run all tests
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Check TypeScript
npx tsc --noEmit

# Run specific test file
npm test -- src/hooks/__tests__/useFetch.test.ts

# Coverage report
npm run test:coverage
```

---

## Key Resources

| Resource | Path |
|----------|------|
| Testing Skill | `.agent/skills/testing-patterns/SKILL.md` |
| Mock Factories | `src/__mocks__/supabase.ts` |
| Vitest Config | `vitest.config.ts` |
| Vitest Setup | `vitest.setup.ts` |
| Full PRD | `docs/prds/admin-feedback-system/PRD_42_Test_Coverage_Expansion.md` |

---

## Goal

**Coverage Target:** 6% → 70%

**Current Status:** Phases A-D complete (1,101 tests), Phase E pending
