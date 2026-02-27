# PRD 66: Fix Broken Test Suite — Environment Mock Gaps

> **Order:** 66
> **Status:** 📋 Proposed
> **Type:** Technical Debt
> **Dependencies:** None
> **Blocks:** PRD 61 (Testing Gaps), PRD 42 (Test Coverage Expansion)

---

## Objective

Fix 5 test files (40 tests) that fail due to missing jsdom environment mocks, outdated test expectations, and incomplete provider wrappers. These are pre-existing failures unrelated to any specific PRD — they must be fixed before PRD 61 (Testing Gaps) can establish a green baseline.

---

## Agent Context

| File | Purpose |
|------|---------|
| `src/components/analytics/__tests__/GoogleTagManager.test.tsx` | GTM noscript iframe rendering |
| `src/components/layout/__tests__/NavHeader.test.tsx` | Navigation header with sticky scroll |
| `src/components/sharing/__tests__/ShareContentPicker.test.tsx` | Share content customization picker |
| `src/lib/sharing/__tests__/shareMessageBuilder.test.ts` | Share message generation |
| `src/components/providers/__tests__/AuthProvider.test.tsx` | Auth session and profile loading |
| `.claude/skills/testing-patterns/SKILL.md` | Testing patterns and mocking strategies |
| `.claude/skills/react-debugging/SKILL.md` | Component debugging patterns |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Verify AuthProvider mock structure matches real schema |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Read all 5 test files + source files to confirm root causes |
| 2 | `[WRITE]` | Fix GoogleTagManager test `[PARALLEL with Phase 3, 4, 5, 6]` |
| 3 | `[WRITE]` | Fix NavHeader test `[PARALLEL]` |
| 4 | `[WRITE]` | Fix ShareContentPicker test `[PARALLEL]` |
| 5 | `[WRITE]` | Fix shareMessageBuilder test `[PARALLEL]` |
| 6 | `[WRITE]` | Fix AuthProvider test `[PARALLEL]` |
| 7 | `[WRITE]` | Run full test suite, verify zero regressions `[SEQUENTIAL]` |

---

## Detailed Failures & Fixes

### File 1: GoogleTagManager.test.tsx (1 failure)

**Root cause:** jsdom does not render children inside `<noscript>` elements. Test queries for an `<iframe>` inside `<noscript>` via `querySelector`, gets `null`.

**Fix:** Check `noscript.innerHTML` contains the expected GTM iframe URL string, instead of querying for a child element.

```typescript
// Before (fails):
const iframe = container.querySelector('noscript iframe');
expect(iframe?.getAttribute('src')).toContain('googletagmanager.com');

// After (works):
const noscript = container.querySelector('noscript');
expect(noscript?.innerHTML).toContain('googletagmanager.com');
```

**Important:** Do NOT change the consent default. GDPR consent is set to `authorized` by design.

---

### File 2: NavHeader.test.tsx (6 failures)

**Root cause:** jsdom does not provide `IntersectionObserver`. Next.js `<Link>` uses it internally for prefetching. All 6 tests crash with `IntersectionObserver is not a constructor`.

**Fix:** Add a class-based `IntersectionObserver` mock in `beforeAll` or the test setup file.

```typescript
beforeAll(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});
```

---

### File 3: ShareContentPicker.test.tsx (18 failures)

**Root cause:** `ShareContentPicker` uses shadcn `Tooltip` component, which requires a `TooltipProvider` ancestor. Tests render without it, causing "Tooltip must be used within TooltipProvider" error.

**Fix:** Wrap test renders with `TooltipProvider`:

```typescript
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}
```

---

### File 4: shareMessageBuilder.test.ts (14 failures)

**Root cause:** Tests were written when share messages included `#StepLeague` hashtag. The builder was later updated to use the URL `https://stepleague.app` instead. Tests still assert on the old hashtag and emoji patterns.

**Fix:** Update test expectations to match current builder output:
- Replace `#StepLeague` assertions with `stepleague.app`
- Update emoji expectations to match current format
- Fix URL exclusion test (URL is now part of the message, not a hashtag)

---

### File 5: AuthProvider.test.tsx (1 failure)

**Root cause:** The "should accept session if token is not expired" test mocks `supabase.from()` for profile fetching but only supports `.select().eq().single()` chain. The real code uses a deeper chain: `.select().eq().eq().is().eq().order()`.

**Fix:** Create a chainable mock factory:

```typescript
function createChainableMock(resolvedValue: any) {
  const chain: any = {};
  ['select', 'eq', 'is', 'order', 'limit', 'single'].forEach(method => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  return chain;
}

mockSupabaseClient.from.mockReturnValue(createChainableMock({
  data: { id: 'test-user-id', display_name: 'Test User', is_superadmin: false, is_proxy: false },
  error: null,
}));
```

---

## Success Criteria

| Metric | Target | Verification |
|--------|--------|--------------|
| All 5 test files pass | 40/40 green | `npm test` |
| Zero regressions | No existing passing tests break | Full suite comparison |
| `npx tsc --noEmit` | Zero type errors | TypeScript check |

---

## Documentation Update Checklist

- [ ] CHANGELOG.md — "fix: Resolve 40 pre-existing test failures (environment mocks)"
- [ ] `testing-patterns` skill — Add IntersectionObserver mock, TooltipProvider wrapper, chainable Supabase mock patterns
- [ ] PRD_00_Index.md — Update PRD 66 status to Complete
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 66 — short description`

---

## Best Practice References

- **jsdom limitations:** `<noscript>` children are not rendered; `IntersectionObserver` is not available
- **Provider wrappers:** Always wrap components that depend on React context providers in tests
- **Chainable mocks:** Supabase query builder uses method chaining — mocks must return `this` for each method
- **Test maintenance:** When source code changes (e.g., hashtag → URL), tests must be updated to match

---

## Related Documents

- [PRD 61: Testing Gaps](./PRD_61_Testing_Gaps.md) — Adds NEW regression tests (depends on green baseline)
- [PRD 42: Test Coverage Expansion](./PRD_42_Test_Coverage_Expansion.md) — Broader coverage effort
- [Testing Patterns Skill](../../../.claude/skills/testing-patterns/SKILL.md)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-02-27 | Initial | Created PRD from pre-existing test failure analysis during PRD 57 implementation |
