# Implementation Plan - Page Layout System (PRD 15)

## Goal Description
Implement a reusable `PageLayout` component system with **analytics tracking**, **SEO optimization**, **A/B testing support**, **theming (dark/light)**, and **accessibility** built-in.

## Enhanced Requirements

| Category | Implementation |
|----------|----------------|
| **Analytics** | `data-track-*` attributes, `trackComponentView()`, action click tracking |
| **SEO** | Semantic HTML (`<header>`, `<main>`, `<nav>`), unique IDs, proper heading hierarchy |
| **A/B Testing** | `data-variant` attributes on all key elements |
| **Theming** | CSS variables via `globals.css`, no hardcoded colors |
| **Accessibility** | ARIA roles, `aria-label`, `aria-busy`, focus management |
| **Extensibility** | Slot pattern: `headerSlot`, `beforeContent`, `afterContent` |

## Proposed Changes

### Components (CREATED ✅)

#### [NEW] [PageHeader.tsx](file:///d:/Vasso/coding projects/SCL v3 AG/scl-v3/src/components/layout/PageHeader.tsx)
- Title, subtitle, action buttons, breadcrumbs
- Analytics: `data-track-click`, `data-track-view`, `trackInteraction()`
- A/B: `data-variant`, `testVariant` prop
- SEO: `id="page-header-{pageId}"`, `role="banner"`

#### [NEW] [EmptyState.tsx](file:///d:/Vasso/coding projects/SCL v3 AG/scl-v3/src/components/layout/EmptyState.tsx)
- Icon, title, description, primary/secondary actions
- Analytics: `trackComponentView()` on mount
- Sizes: `sm`, `md`, `lg`

#### [NEW] [LoadingSkeleton.tsx](file:///d:/Vasso/coding projects/SCL v3 AG/scl-v3/src/components/layout/LoadingSkeleton.tsx)
- Variants: `list`, `cards`, `table`, `content`, `custom`
- Composable primitives: `SkeletonLine`, `SkeletonCard`, `SkeletonRow`
- Accessibility: `aria-busy`, `role="status"`

#### [NEW] [PageLayout.tsx](file:///d:/Vasso/coding projects/SCL v3 AG/scl-v3/src/components/layout/PageLayout.tsx)
- Orchestrates header, loading, empty, and content states
- Props: `loading`, `isEmpty`, `empty`, `loadingConfig`, slots
- Padding/maxWidth variants for responsive layouts

### Page Migrations (TODO)

#### [MODIFY] [admin/feedback/page.tsx](file:///d:/Vasso/coding projects/SCL v3 AG/scl-v3/src/app/admin/feedback/page.tsx)
- Wrap in `PageLayout` with `title="User Feedback"`
- Move "Full Kanban Board" to `actions` prop

#### [MODIFY] [admin/kanban/page.tsx](file:///d:/Vasso/coding projects/SCL v3 AG/scl-v3/src/app/admin/kanban/page.tsx)
- Wrap in `PageLayout` with `title="Kanban Board"`
- Move legend to `afterContent` slot

#### [MODIFY] [dashboard/page.tsx](file:///d:/Vasso/coding projects/SCL v3 AG/scl-v3/src/app/(dashboard)/dashboard/page.tsx)
- Wrap in `PageLayout` with `title="Your Leagues"`
- Use built-in `empty` prop for no-leagues state

### Documentation

#### [MODIFY] [design-system/page.tsx](file:///d:/Vasso/coding projects/SCL v3 AG/scl-v3/src/app/admin/design-system/page.tsx)
- Add PageLayout section with all variants

## Verification Plan

### Automated
- `npm run build` passes

### Manual
- Visit migrated pages, verify header/actions
- Test loading state (temporarily force `loading={true}`)
- Test empty state (force `isEmpty={true}`)
- Verify dark/light mode compatibility

