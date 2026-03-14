---
description: Testing conventions for Vitest unit tests and Playwright E2E tests
paths:
  - src/**/*.test.ts
  - src/**/*.test.tsx
  - src/**/__tests__/**
  - e2e/**
  - vitest.config.ts
  - vitest.setup.ts
  - playwright.config.ts
---

# Testing Rules

## Vitest (Unit/Integration)

### Use Existing Mock Factories
```typescript
// ✅ Use shared mocks
import { createMockUser, createMockProxy, createMockSupabaseClient } from '@/__mocks__/supabase';

// ❌ Don't create ad-hoc Supabase mocks in individual test files
```

### Global Mocks Are Pre-Configured
`vitest.setup.ts` already mocks: `next/navigation`, `next/headers`, `matchMedia`, `ResizeObserver`, `IntersectionObserver`.
**Do NOT re-mock these in individual tests** — they're globally available.

### Test File Location
Co-locate tests in `__tests__/` next to the source code:
```
src/lib/auth/__tests__/sessionCache.test.ts
src/app/api/proxy-claim/__tests__/route.test.ts
src/hooks/__tests__/useExport.test.ts
```

### Import Pattern
```typescript
// ✅ Explicit imports (project convention — globals are enabled but explicit is preferred)
import { describe, it, expect, beforeEach, vi } from 'vitest';
```

### Supabase Client Mocking
Use the chainable mock. Override return values per-test:
```typescript
const mockClient = createMockSupabaseClient();
mockClient.from.mockReturnValue({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
});
```

### Console Suppression
`vitest.setup.ts` suppresses `console.log` and `console.warn`. Don't override in individual tests unless actively debugging. Re-enable `console.error` only if testing error output.

### Coverage Thresholds
70% for lines, functions, branches, and statements. Never lower these values.

## Playwright (E2E)

### Test Location & Structure
E2E tests go in `e2e/` directory (not `src/`):
```
e2e/auth.spec.ts
e2e/homepage.spec.ts
e2e/fixtures/auth.ts
```

### Auth Helper
```typescript
// ✅ Use the shared login helper
import { login } from './fixtures/auth';

test('can access dashboard', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
```

### Configuration
- Base URL: `process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'`
- Color scheme: dark (matches default theme)
- Credentials: `SL_PW_LOGIN_TEST_USERNAME` / `SL_PW_LOGIN_TEST_PASSWORD` from `.env.local`
- Retries: 2 on CI, 0 locally

## Test-Driven Bug Fixing

When fixing a bug:
1. **Write failing test first** — reproduces the bug
2. **Fix the code** — make test pass
3. **Commit both** — test prevents regression

## Commands

| Task | Command |
|------|---------|
| Run all unit tests | `npx vitest run` |
| Watch mode | `npm run test:watch` |
| Coverage | `npm run test:coverage` |
| E2E (headless) | `npm run test:e2e` |
| E2E (visible) | `npm run test:e2e:headed` |
| Single test file | `npx vitest run path/to/test` |
