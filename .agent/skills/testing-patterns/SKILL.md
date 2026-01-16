---
name: testing-patterns
description: Testing patterns for Next.js App Router with Supabase. Use when adding tests, verifying fixes, or preventing regressions. Keywords: test, testing, jest, vitest, unit test, integration test, mock, Supabase mock.
compatibility: Antigravity, Claude Code, Cursor
metadata:
  version: "1.0"
  project: "stepleague"
---

# Testing Patterns Skill

## Overview

StepLeague currently has minimal test coverage. This skill provides patterns for adding tests progressively.

---

## Recommended Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (faster than Jest for Vite/Next) |
| **React Testing Library** | Component testing |
| **MSW** | API mocking |
| **@testing-library/user-event** | User interaction simulation |

---

## Test File Structure

```
src/
├── components/
│   └── MyComponent.tsx
│   └── __tests__/
│       └── MyComponent.test.tsx
├── lib/
│   └── utils.ts
│   └── __tests__/
│       └── utils.test.ts
└── app/
    └── api/
        └── route.ts
        └── __tests__/
            └── route.test.ts
```

---

## Pattern 1: Unit Testing Utilities

```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, calculateStreak } from '../utils';

describe('formatDate', () => {
  it('formats ISO date to display format', () => {
    expect(formatDate('2026-01-15')).toBe('Jan 15, 2026');
  });

  it('handles null gracefully', () => {
    expect(formatDate(null)).toBe('—');
  });
});
```

---

## Pattern 2: Component Testing

```typescript
// src/components/__tests__/LeaderboardCard.test.tsx
import { render, screen } from '@testing-library/react';
import { LeaderboardCard } from '../LeaderboardCard';

describe('LeaderboardCard', () => {
  it('displays user name and steps', () => {
    render(
      <LeaderboardCard 
        user={{ name: 'John', steps: 10000 }} 
        rank={1} 
      />
    );
    
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  it('shows crown for rank 1', () => {
    render(<LeaderboardCard user={mockUser} rank={1} />);
    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });
});
```

---

## Pattern 3: Mocking Supabase

```typescript
// src/lib/__mocks__/supabase.ts
export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
  },
};

// In test file
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => mockSupabase,
}));
```

---

## Pattern 4: API Route Testing

```typescript
// src/app/api/submissions/__tests__/route.test.ts
import { POST } from '../route';
import { NextRequest } from 'next/server';

describe('POST /api/submissions', () => {
  it('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/submissions', {
      method: 'POST',
      body: JSON.stringify({ steps: 5000 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates submission with valid data', async () => {
    // Mock auth
    vi.mocked(getUser).mockResolvedValue({ id: 'user-1' });
    
    const req = new NextRequest('http://localhost/api/submissions', {
      method: 'POST',
      body: JSON.stringify({ steps: 5000, for_date: '2026-01-15' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
```

---

## Testing Priorities

When adding tests, prioritize:

1. **Utilities** - Pure functions, easy to test
2. **API Routes** - Critical business logic
3. **Complex Components** - Forms, data displays
4. **Hooks** - Custom hooks with logic

---

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Single file
npm test -- src/lib/__tests__/utils.test.ts
```

---

## Test-Driven Bug Fixing

When fixing a bug:

1. **Write failing test first** - Reproduces the bug
2. **Fix the code** - Make test pass
3. **Commit both** - Test prevents regression

```typescript
// Example: Bug fix with test
describe('calculateStreak', () => {
  // This test was added when fixing bug #123
  it('handles timezone edge case at midnight', () => {
    const dates = ['2026-01-14', '2026-01-15'];
    expect(calculateStreak(dates, '2026-01-15T00:30:00+07:00')).toBe(2);
  });
});
```

---

## Related Skills

- `react-debugging` - Use tests to prevent loops
- `api-handler` - Patterns for API testing
