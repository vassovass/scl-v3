---
description: Hook conventions, duplicate prevention, and render loop avoidance
paths:
  - src/hooks/**
---

# Hook Rules

## Before Creating a New Hook

**Check if it already exists.** There are 31+ hooks in `src/hooks/`. Search before creating:

```bash
# Search for similar hooks
grep -r "useX" src/hooks/ --include="*.ts"
```

### Existing hooks by domain:
- **Data fetching**: `useFetch`, `useFetchWithTimeout`, `useUserStats`, `useUserSubmissions`, `useSubmissionHistory`, `useSubmissionStatus`
- **Offline/PWA**: `useOfflineQueue`, `useOfflineSync`, `usePWA`
- **Settings/Prefs**: `useAppSettings`, `useFeatureFlag`, `usePreferences`, `useThemeSettings`, `useUserTheme`
- **UI state**: `useBranding`, `useMenuConfig`, `useFilterPersistence`, `useFirstVisit`
- **Import/Export**: `useImport`, `useExport`
- **Social**: `useShare`, `useShareModal`, `useShareNudge`
- **Other**: `useConflictCheck`, `useAttachments`, `useEngagement`, `useTour`, `useABTest`, `usePagePerformance`

## Naming Convention

All hooks MUST be named `useX` and exported from their own file in `src/hooks/`.

## Render Loop Prevention

Hooks are the #1 source of infinite render loops. Follow these rules:

- **Never** put objects/arrays as default values in useState — they create new references each render
- **Never** include a setState function in its own useEffect dependency array
- **Always** memoize objects passed to context providers
- **Wrap** expensive computations in `useMemo`, event handlers in `useCallback`
- **useSearchParams** — any component using it MUST be wrapped in `<Suspense>`

See `react-debugging` skill for detailed patterns.

## Testing

Every new hook should have tests in `src/hooks/__tests__/useX.test.ts`. Use existing test patterns from that directory.
