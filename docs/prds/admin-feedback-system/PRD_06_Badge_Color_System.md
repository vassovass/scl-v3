# PRD 06: Badge & Color System

> **Order:** 6 of 15  
> **Previous:** [PRD 5: Universal Data Fetching](./PRD_05_Universal_Data_Fetching.md)  
> **Next:** [PRD 7: Admin Feedback Page](./PRD_07_Admin_Feedback_Page.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/lib/filters/feedbackFilters.ts` - Current TYPE_COLORS, STATUS_COLORS
   - `src/components/admin/KanbanBoard.tsx` - Has TYPE_STYLES, RELEASE_OPTIONS
   - `src/components/roadmap/RoadmapView.tsx` - Has TYPE_BADGES, STATUS_BADGES
   - `src/app/(dashboard)/league/[id]/leaderboard/page.tsx` - Has BADGE_STYLES

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2025)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete
   - Update `/admin/design-system` page with new badge components

3. **After completion:**
   - Commit with message format: `feat(PRD-XX): Brief description`
   - Mark this PRD as done on the Kanban board
   - Update `AGENTS.md` if adding new patterns

---

## Outcome

A centralized badge and color system that consolidates scattered color definitions into a single source of truth, ensuring visual consistency across the app.

---

## Problem Statement

Badge/color configurations are duplicated across multiple files:

| File | Duplicated Definitions |
|------|----------------------|
| `feedbackFilters.ts` | `TYPE_COLORS`, `STATUS_COLORS` |
| `KanbanBoard.tsx` | `TYPE_STYLES`, `RELEASE_OPTIONS` colors |
| `RoadmapView.tsx` | `TYPE_BADGES`, `STATUS_BADGES` |
| `leaderboard/page.tsx` | `BADGE_STYLES` for achievements |

**Issues:**

- Same colors defined in 4+ places
- Inconsistent naming (`TYPE_COLORS` vs `TYPE_STYLES` vs `TYPE_BADGES`)
- Adding a new type requires editing multiple files
- No single source of truth

---

## What is Needed

### 1. Centralized Badge Config

Create `src/lib/badges.ts`:

```typescript
export const BADGE_CONFIG = {
  // Feedback/task types
  type: {
    bug: { 
      label: '🐛 Bug', 
      className: 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
    },
    feature: { ... },
    improvement: { ... },
    general: { ... },
    positive: { ... },
    negative: { ... },
  },
  
  // Workflow statuses
  status: {
    backlog: { label: '📋 Backlog', className: '...' },
    todo: { label: '📝 To Do', className: '...' },
    in_progress: { label: '🔨 In Progress', className: '...', pulse: true },
    review: { label: '👀 Review', className: '...' },
    done: { label: '✅ Done', className: '...' },
  },
  
  // Release timelines
  release: {
    now: { label: '🔥 Now', className: '...' },
    next: { label: '⏭️ Next', className: '...' },
    later: { label: '📅 Later', className: '...' },
    future: { label: '🔮 Future', className: '...' },
  },
  
  // Leaderboard achievements
  achievement: {
    streak_7: { icon: '🔥', label: '7-Day Streak', className: '...' },
    // ...
  },
};
```

### 2. Badge Component

Create `src/components/ui/Badge.tsx`:

```tsx
interface BadgeProps {
  category: 'type' | 'status' | 'release' | 'achievement';
  value: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function Badge({ category, value, size = 'md', showLabel = true }: BadgeProps) {
  const config = BADGE_CONFIG[category]?.[value];
  if (!config) return null;
  
  return (
    <span className={cn(config.className, SIZE_CLASSES[size])}>
      {showLabel ? config.label : config.icon}
    </span>
  );
}
```

### 3. Utility Functions

```typescript
// Get just the color class (for existing components)
export function getBadgeClass(category: string, value: string): string;

// Get the full config object
export function getBadgeConfig(category: string, value: string): BadgeConfig | undefined;
```

---

## Migration Path

### Phase 1: Create Central Config

1. Create `src/lib/badges.ts` with all definitions
2. Create `src/components/ui/Badge.tsx` component
3. Export utilities

### Phase 2: Update Existing Files

Update these files to import from central config:

| File | Change |
|------|--------|
| `feedbackFilters.ts` | Remove TYPE_COLORS/STATUS_COLORS, re-export from badges.ts |
| `KanbanBoard.tsx` | Import from badges.ts |
| `RoadmapView.tsx` | Import from badges.ts |
| `leaderboard/page.tsx` | Import from badges.ts |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/badges.ts` | CREATE - Central badge configuration |
| `src/components/ui/Badge.tsx` | CREATE - Reusable Badge component |
| `src/lib/filters/feedbackFilters.ts` | MODIFY - Import from badges.ts |
| `src/components/admin/KanbanBoard.tsx` | MODIFY - Import from badges.ts |
| `src/components/roadmap/RoadmapView.tsx` | MODIFY - Import from badges.ts |
| `src/app/admin/design-system/page.tsx` | MODIFY - Add Badge component examples |

---

## Success Criteria

- [ ] Central `BADGE_CONFIG` contains all type/status/release/achievement definitions
- [ ] `Badge` component works with all categories
- [ ] At least 2 existing files migrated to use central config
- [ ] Design system page updated with Badge examples
- [ ] No duplicate color definitions remain
- [ ] Build passes (`npm run build`)

---

## Visual Reference

The badge should render like this:

```
┌─────────────────┐
│ 🐛 Bug          │  <- type badge
└─────────────────┘

┌─────────────────┐
│ 🔨 In Progress  │  <- status badge (with optional pulse)
└─────────────────┘

┌─────────────────┐
│ 🔥 Now          │  <- release badge
└─────────────────┘
```

---

## Out of Scope

- Animated badges
- User-customizable badge colors
- Badge icons as SVG (keep using emoji for now)

---

## Related Files for Reference

```
src/
├── lib/
│   └── filters/feedbackFilters.ts    # Current TYPE_COLORS, STATUS_COLORS
├── components/
│   ├── admin/KanbanBoard.tsx          # TYPE_STYLES
│   ├── roadmap/RoadmapView.tsx        # TYPE_BADGES, STATUS_BADGES
│   └── ui/                            # Where Badge.tsx goes
└── app/
    ├── admin/design-system/page.tsx   # Update with examples
    └── (dashboard)/league/[id]/leaderboard/page.tsx  # BADGE_STYLES
```

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for badge & color system |
