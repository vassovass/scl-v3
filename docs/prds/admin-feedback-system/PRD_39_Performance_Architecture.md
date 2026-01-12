# PRD 39: Performance & Stability Architecture

> **Order:** 39 (Follows [PRD 38: Notification Infrastructure](./PRD_38_Notification_Infrastructure.md))
> **Status:** 📋 Proposed
> **Type:** System Architecture / Technical Debt

---

## 🎯 Objective
Establish a robust, "Systems Thinking" architecture for performance and stability. This moves beyond spot-fixes to create a resilient foundation for:
1.  **Server-Side Rendering (SSR)** for dashboard data (Speed).
2.  **Hybrid Caching** that keeps Server and Client in sync (Consistency).
3.  **Frontend Stability** against script failures and network issues (Resilience).

---

## ⚠️ Agent Context & Documentation Strategy (Mandatory)

> **User Request:** Agents must know how the system works. "Don't just build it, document it."

We will implement these **3 Proactive Documentation Items**:

1.  **`ARCHITECTURE.md` (The "Bible")**
    *   **What:** A comprehensive technical manual living in the root.
    *   **Content:** Detailed diagrams of the "Hybrid Sync" flow, Error Handling decision trees, and Caching Registry definitions.
    *   **Rule:** Every PRD must reference this.

2.  **`AGENTS.md` Context Injection**
    *   **Action:** Add a new section `## 8. Performance & Caching Rules` to `AGENTS.md`.
    *   **Items:** link to `ARCHITECTURE.md`, rules for using `serverCache.ts` vs `menuCache.ts`, and the "SafeLazy" wrapper usage.

3.  **Developer SOP: The "Cache Registry" Pattern**
    *   **What:** A strict code pattern. No ad-hoc cache tags.
    *   **Implementation:** All cache configuration must be defined in `src/lib/cache/registry.ts`.
    *   **Enforcement:** An ESLint rule or high-visibility comment effectively banning `unstable_cache` usage outside the registry.

---

## 🏗️ Detailed Feature Requirements (The 12 Robust Items)

### A. Backend & Caching Strategy (6 Items)

| # | Feature | Problem Solved | Implementation |
|---|---|---|---|
| **B-1** | **Type-Safe Cache Registry** | Eliminate "magic strings" and inconsistent timeouts. | Centralized `src/lib/cache/registry.ts` defining all keys/TTLs. |
| **B-2** | **Hierarchical Tagging** | Granular invalidation (wiping one league vs all). | Factory function `createTags('entity', 'id')` -> `['entity', 'entity:id']`. |
| **B-3** | **Hybrid Cache Sync** | Sync Server Data with Client IndexedDB. | Version handshake in Root Layout; background re-fetch on mismatch. |
| **B-4** | **Usage of Server Components** | Zero-waterfall initial load. | Move Dashboard fetching to Server; wrap `getUserLeagues` with `serverCache`. |
| **B-5** | **Database Webhook Invalidation** | "Source of Truth" consistency. | `/api/system/revalidate` endpoint triggered by Supabase DB events. |
| **B-6** | **Circuit-Breaker Pattern** | Prevent cascading failures during DB spikes. | Fail fast to fallback data if timeouts occur > 5x/minute. |

### B. Frontend Stability Strategy (6 Items)

| # | Feature | Problem Solved | Implementation |
|---|---|---|---|
| **F-1** | **`SafeLazy` Wrapper** | "White Screen of Death" if chunk fails. | HOC with `ErrorBoundary` + `reportErrorClient`. |
| **F-2** | **Analytics Shim** | "gtag is not defined" (AdBlockers). | Typed wrapper `safeTrackEvent()` that checks presence before calling. |
| **F-3** | **Offline-Aware Script Loader** | Bandwidth waste / Log spam. | Hook `useNetworkAwareLoad` blocks widgets when `!navigator.onLine`. |
| **F-4** | **CLS Placeholder System** | Layout shifts from lazy widgets. | Enforce `Skeleton` components matching exact pixel dims of widgets. |
| **F-5** | **Module Error Boundary** | Self-healing UI for widgets. | "Retry" button inside component boundary instead of whole page crash. |
| **F-6** | **Third-Party Sandboxing** | Main thread blocking (TBT). | Use `requestIdleCallback` to delay widget init until 4s after LCP. |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
| :--- | :--- | :--- |
| **LCP (Dashboard)** | < 1.5s | Lighthouse (Mobile) |
| **TBT (Blocking)** | < 200ms | Lighthouse |
| **Crash Rate** | 0% | Error Boundary Logs |
| **Cache Sync** | < 1s | DevTools Timing (Server update -> Client reflect) |
| **Offline** | No Errors | Localhost Network Throttling |

---

## 📅 Phased Implementation Plan

### Phase A: Architecture Foundation (This Sprint)
1.  Establish `ARCHITECTURE.md`.
2.  Refactor Dashboard to Server Component.
3.  Implement `SafeLazy` for widgets.

### Phase B: Robustness & Caching (Next Sprint)
4.  Build Cache Registry & Webhooks.
5.  Implement Hybrid Sync (Version Handshake).

### Phase C: Documentation & Polish
6.  Finalize `AGENTS.md` updates.
7.  Verify with full Lighthouse run.
