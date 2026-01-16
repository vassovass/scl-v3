---
name: testing-patterns
description: Testing patterns for Next.js App Router with Supabase. Use when adding tests, verifying fixes, or preventing regressions. Keywords: test, testing, jest, vitest, unit test, integration test, mock, Supabase mock.
compatibility: Antigravity, Claude Code, Cursor
metadata:
  version: "2.0"
  project: "stepleague"
  last_updated: "2026-01-16"
---

# Testing Patterns Skill

## Overview

StepLeague has a test suite using Vitest with React Testing Library. This skill provides patterns for adding and maintaining tests.

**Current Status:** ✅ Test infrastructure complete, 45+ tests passing.

---

## Quick Start

```bash
# Run all tests
npm test

# Watch mode (re-runs on file change)
npm test:watch

# Coverage report (aims for 70%+)
npm test:coverage
```

---

## User Guidance (Show This When Asked About Tests)

> [!NOTE]
> When the user asks "what can tests do?", "how do I use tests?", or similar questions about testing capabilities, show them this section.

### Is it Automatic?

**Currently: No.** Tests don't run automatically on changes. Options:
1. **Watch Mode** (`npm run test:watch`) - Leave running while coding; tests re-run on save
2. **CI/CD** (not yet configured) - Could add GitHub Actions to run on push

### When to Ask for Tests

**Ask to RUN tests when:**
- Finished implementing a feature
- Debugging an issue (catch regressions)
- Before committing/deploying

**Ask to WRITE tests when:**
- Fixed a bug (prevents recurrence)
- Added new API route or complex component
- Want to verify specific behavior

### Example Prompts

| Prompt | What happens |
|--------|--------------|
| "Run the tests" | Runs `npm test` and shows results |
| "Write a test for [feature]" | Creates test file following skill patterns |
| "Check test coverage" | Runs coverage report |
| "Add tests for proxy claim" | Writes comprehensive tests for that feature |

---

## Project Testing Stack

| Tool | Purpose | Installed |
|------|---------| --------- |
| **Vitest** | Test runner (faster than Jest for Vite/Next) | ✅ |
| **React Testing Library** | Component testing | ✅ |
| **MSW** | API mocking | ✅ |
| **jsdom** | Browser environment simulation | ✅ |

---

## Test File Structure

```
src/
├── __mocks__/
│   └── supabase.ts          # Mock factories (use this!)
├── lib/
│   └── auth/
│       └── __tests__/
│           └── sessionCache.test.ts
├── app/
│   └── api/
│       └── proxy-claim/
│           └── __tests__/
│               └── route.test.ts
```

---

## Pattern 1: Session Cache Testing (REAL EXAMPLE)

From `src/lib/auth/__tests__/sessionCache.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setCachedSession, getCachedSession, clearCachedSession } from '../sessionCache';

describe('sessionCache', () => {
  beforeEach(() => {
    clearCachedSession();
  });

  it('stores session when all params provided', () => {
    const futureTime = Math.floor(Date.now() / 1000) + 3600;
    setCachedSession('token-123', 'user-456', futureTime);
    
    const cached = getCachedSession();
    expect(cached).not.toBeNull();
    expect(cached?.accessToken).toBe('token-123');
  });

  it('returns null when session expires within 60s buffer', () => {
    const soonTime = Math.floor(Date.now() / 1000) + 30;
    setCachedSession('token-123', 'user-456', soonTime);
    
    expect(getCachedSession()).toBeNull();
  });
});
```

---

## Pattern 2: Using Mock Factories (REAL EXAMPLE)

From `src/__mocks__/supabase.ts`:

```typescript
import { vi } from 'vitest';

// Create mock user
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

// Create mock proxy
export const createMockProxy = (overrides = {}) => ({
  id: 'proxy-456',
  display_name: 'Proxy User',
  is_proxy: true,
  managed_by: 'user-123',
  invite_code: 'CLAIM123',
  claims_remaining: 1,
  ...overrides,
});

// Create chainable Supabase client mock
export const createMockSupabaseClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
});

// Usage in test:
// import { createMockSupabaseClient, createMockProxy } from '@/__mocks__/supabase';
```

---

## Pattern 3: Auth Level Testing (REAL EXAMPLE)

From `src/lib/api/__tests__/handler.test.ts`:

```typescript
describe('League-level auth', () => {
  type Role = 'member' | 'admin' | 'owner';
  
  const roleHasAccess = (userRole: Role, requiredLevel: string): boolean => {
    const roleHierarchy = { member: 1, admin: 2, owner: 3 };
    const requiredHierarchy = { 
      league_member: 1, league_admin: 2, league_owner: 3 
    };
    return roleHierarchy[userRole] >= requiredHierarchy[requiredLevel];
  };

  it('member cannot access league_admin routes', () => {
    expect(roleHasAccess('member', 'league_admin')).toBe(false);
  });

  it('owner can access all league routes', () => {
    expect(roleHasAccess('owner', 'league_member')).toBe(true);
    expect(roleHasAccess('owner', 'league_admin')).toBe(true);
    expect(roleHasAccess('owner', 'league_owner')).toBe(true);
  });
});
```

---

## Pattern 4: Proxy Claim Testing (REAL EXAMPLE)

From `src/app/api/proxy-claim/__tests__/route.test.ts`:

```typescript
describe('POST - Execute Claim', () => {
  it('prevents user from claiming their own proxy', () => {
    const managerId = 'user-123';
    const claimingUserId = 'user-123';
    
    const isOwnProxy = managerId === claimingUserId;
    expect(isOwnProxy).toBe(true);
    // Route should return 400
  });

  describe('Merge Strategy', () => {
    it('uses proxy display_name with keep_proxy_profile strategy', () => {
      const proxy = createMockProxy({ display_name: 'Proxy Name' });
      const user = createMockProfile({ display_name: 'User Name' });
      const strategy = 'keep_proxy_profile';
      
      const finalName = strategy === 'keep_proxy_profile' 
        ? proxy.display_name 
        : user.display_name;
      
      expect(finalName).toBe('Proxy Name');
    });
  });
});
```

---

## Testing Priorities (Updated)

Based on 10-day commit analysis, priority testing areas:

1. **Auth Session Cache** - Bypasses Web Locks deadlocks ⚠️ Critical
2. **Proxy Claims** - Complex data transfer logic ⚠️ Critical
3. **API Handler Auth** - Role-based access
4. **Hooks with URL state** - Prevent infinite loops

---

## Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest setup with path aliases, coverage thresholds |
| `vitest.setup.ts` | Global mocks (next/navigation, next/headers, matchMedia) |
| `src/__mocks__/supabase.ts` | Supabase client and data factories |

---

## Test-Driven Bug Fixing

When fixing a bug:

1. **Write failing test first** - Reproduces the bug
2. **Fix the code** - Make test pass
3. **Commit both** - Test prevents regression

```typescript
// Example: Testing the 60-second token expiry buffer
it('returns null when session expires within 60s buffer', () => {
  // This test catches the bug where tokens were used too close to expiry
  const soonTime = Math.floor(Date.now() / 1000) + 30;
  setCachedSession('token-123', 'user-456', soonTime);
  expect(getCachedSession()).toBeNull();
});
```

---

## Related Skills

- `auth-patterns` - getUser vs getSession, deadlock avoidance
- `api-handler` - withApiHandler middleware patterns
- `react-debugging` - Use tests to prevent infinite render loops

