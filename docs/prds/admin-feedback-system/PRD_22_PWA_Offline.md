# PRD 22: PWA & Offline Support

> **Order:** 22 of 33
> **Previous:** [PRD 21: shadcn/ui Integration](./PRD_21_shadcn_Integration.md)
> **Next:** [PRD 23: Global Leaderboard](./PRD_23_Global_Leaderboard.md)
> **Prioritized By:** User Request (2026-01-05) - "Unfinished Items"
> **Status:** ✅ Complete

---

## ⚠️ Agent Instructions (MANDATORY)

1. **Read `AGENTS.md`** - Mobile-first, strict error handling, documentation rules.
2. **Read `src/app/(dashboard)/submit-steps/page.tsx`** - Context for current offline detection.
3. **Update `CHANGELOG.md`** and `ROADMAP.md` upon completion.
4. **Testing** - Use Chrome DevTools "Offline" mode to verify queuing logic.

---

## Problem Statement

**Current:**
- `manifest.json` exists (installable).
- "You are offline" warning appears on the Submit page.
- **BUT**: Users cannot submit if offline. Attempts fail or are blocked. This breaks the core loop for users with spotty connections (e.g., gym basements, trails).

**Goal:**
- Allow users to "submit" while offline.
- Queue the submission locally (`IndexedDB` or `localStorage`).
- Automatically sync when back online.
- Provide clear UI feedback ("Saved offline. Will sync when online.").

---

## Outcome

1. **Robust Offline Submission:** Users can submit steps without network.
2. **Sync Engine:** Automatic background sync when connection is restored.
3. **Queue Management:** User can see pending items.
4. **PWA Polish:** Service Worker caching for core app shell (Submit, Leaderboard) so the app *opens* offline.

---

## Technical Specifications

### 1. Local Storage Schema (IndexedDB/Dexie)

Use `idb` or `dexie` (lightweight wrapper) for structured storage.

```typescript
interface OfflineSubmission {
  id: string; // UUID
  userId: string;
  steps: number;
  date: string;
  proofBlob?: Blob; // If managing images
  proofPath?: string; // If image was somehow staged (optional)
  createdAt: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}
```

### 2. Service Worker & Caching

- Use `next-pwa` or custom logic to cache:
  - `/submit-steps` (Critical)
  - `/dashboard`
  - CSS/JS chunks
  - Common icons

### 3. Sync Logic (`useOfflineSync` hook)

```typescript
// Pseudo-hook
const useOfflineSync = () => {
  const isOnline = useIsOnline(); // navigator.onLine listener
  
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline]);

  const processQueue = async () => {
    const pending = await db.submissions.where('status').equals('pending').toArray();
    for (const sub of pending) {
       try {
         // Upload image first if needed
         // POST /api/submissions
         await markSynced(sub.id);
         toast.success("Offline submission synced!");
       } catch (err) {
         // Handle failure
       }
    }
  };
}
```

### 4. UI Changes

- **Submit Page**:
  - If offline, "Submit" button becomes "Save Offline".
  - Toast: "Saved to outbox. Will sync automatically."
- **Dashboard / Nav**:
  - Small "Syncing..." or "Offline Mode" indicator if items are pending.

---

## Implementation Steps

1.  **Install Dependencies**: `idb` or `dexie`, `next-pwa` (if not present/configured).
2.  **Service Worker**: Configure `next.config.js` for PWA offline caching.
3.  **Storage Layer**: Create `src/lib/offline/storage.ts`.
4.  **Sync Hook**: Create `src/hooks/useOfflineSync.ts`.
5.  **UI Integration**: Update `SubmitForm.tsx` to handle offline state.
6.  **Verification**: Test offline, submit, go online, verify sync.

---

## Requirements Checklist

- [ ] Users can open the app offline (Service Worker).
- [ ] Users can submit steps offline.
- [ ] Submissions sync automatically when online.
- [ ] UI clearly indicates "Offline Mode" vs "Online".
- [ ] Images handling? (Store Blob in IDB, upload on sync). Note: `proof_path` requires upload.
- [ ] **Conflict Handling**: If user submits offline for Date X, and server has Date X?
  - Backend already handles "Latest/Highest wins". Syncing is safe.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for PWA/Offline features |
