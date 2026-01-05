# PRD 05: Universal Data Fetching

> **Order:** 5 of 15  
> **Previous:** [PRD 4: Unified API Handler](./PRD_04_Unified_API_Handler.md)  
> **Next:** [PRD 6: Badge & Color System](./PRD_06_Badge_Color_System.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/hooks/useShare.ts` - Example of existing hook pattern
   - `src/hooks/useUserStats.ts` - Another hook example
   - `src/app/(dashboard)/dashboard/page.tsx` - See current fetch patterns
   - `src/components/admin/FeedbackList.tsx` - See loading state patterns

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-XX): Brief description`
   - Mark this PRD as done on the Kanban board
   - Update `AGENTS.md` if adding new patterns

---

## Outcome

A universal data fetching hook that standardizes loading states, error handling, and caching across all pages, reducing ~15 lines of boilerplate per page.

---

## Problem Statement

Every page repeats the same fetching pattern:

```tsx
// This pattern is in EVERY page that loads data:
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/...');
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      setData(json.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [dependency]);
```

**Issues:**

- 15+ lines duplicated per page
- Inconsistent error handling
- No automatic refresh/refetch
- Loading states handled differently everywhere

---

## What is Needed

### 1. useFetch Hook

Create `src/hooks/useFetch.ts`:

```typescript
export function useFetch<T>(
  url: string,
  options?: UseFetchOptions
): UseFetchResult<T>
```

### 2. Hook Options

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `enabled` | boolean | true | Conditionally disable fetch |
| `refetchOnMount` | boolean | true | Refetch when component mounts |
| `refetchInterval` | number | - | Auto-refresh interval (ms) |
| `transform` | function | - | Transform response data |

### 3. Return Value

```typescript
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;  // Optimistic update
}
```

### 4. Expected Usage

**Before (current):** ~15 lines  
**After (new):** 1 line

```tsx
// Before
const [leagues, setLeagues] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => { /* 10 more lines */ }, []);

// After
const { data: leagues, loading, refetch } = useFetch<League[]>('/api/leagues');
```

---

## Implementation Notes

### Keep it Simple

- Do NOT add a full library like React Query or SWR
- This is a lightweight custom hook
- Can be upgraded to SWR later if needed

### Handle Auth Requirement

Automatically include credentials:

```typescript
const response = await fetch(url, {
  credentials: 'include',
  ...options,
});
```

### Error Format

Return structured errors:

```typescript
interface FetchError {
  status: number;
  message: string;
  details?: unknown;
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useFetch.ts` | CREATE - Main hook |
| `src/hooks/index.ts` | CREATE - Re-export all hooks |

---

## Success Criteria

- [ ] `useFetch` hook created and exported
- [ ] Loading state works correctly
- [ ] Error state captures API errors
- [ ] `refetch()` function works
- [ ] `enabled` option works (conditional fetching)
- [ ] At least 2 pages migrated as proof
- [ ] TypeScript generics work correctly
- [ ] Build passes (`npm run build`)

---

## Example Migration

### Dashboard Page

```tsx
// Before
export default function DashboardPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchLeagues = async () => {
      const response = await fetch('/api/leagues');
      const data = await response.json();
      setLeagues(data.leagues || []);
      setLoading(false);
    };
    fetchLeagues();
  }, []);
  // ...
}

// After
export default function DashboardPage() {
  const { data, loading } = useFetch<{ leagues: League[] }>('/api/leagues');
  const leagues = data?.leagues || [];
  // ...
}
```

---

## Out of Scope

- Request caching/deduplication (future enhancement)
- Suspense integration
- Server-side data fetching

---

## Related Files for Reference

```
src/
├── hooks/
│   ├── useShare.ts        # Existing hook pattern
│   └── useUserStats.ts    # Another existing hook
└── app/
    ├── (dashboard)/dashboard/page.tsx    # Has fetch pattern
    └── admin/feedback/page.tsx           # Has fetch pattern
```

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for universal data fetching hook |
