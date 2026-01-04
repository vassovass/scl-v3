# PRD 22: User Preferences System

> **Order:** 22 of 30  
> **Previous:** [PRD 21: shadcn Integration](./PRD_21_shadcn_Integration.md)  
> **Next:** [PRD 23: SuperAdmin Settings](./PRD_23_SuperAdmin_Settings.md)  
> **Status:** 📋 Proposed

> [!IMPORTANT]
> **Dependency Note**: This PRD establishes the settings pattern used by PRD 23, 25, 26, 27, 28. Complete this before starting feature PRDs.

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/settings/profile/page.tsx` - Current profile settings (to refactor)
   - `src/types/database.ts` - Profile/user types
   - PRDs 22-24 for settings they introduce

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)
   - Update `/admin/design-system` with SettingsSection pattern

3. **After completion:**
   - Commit with message format: `feat(PRD-25): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**Current:** Profile settings page is monolithic with hardcoded fields.

**Issues:**
1. PRDs 22-24 introduce new user preferences (reminder type, default landing, etc.)
2. No pattern for adding new settings sections
3. Current page doesn't scale for many preference types
4. No separation between "Profile" and "Preferences"

**Needed:** A modular, extensible settings system that can grow with the product.

---

## Outcome

A refactored Settings system with:

1. **Modular `SettingsSection` component** - Reusable wrapper for each settings group
2. **Profile tab** - Name, nickname, email (existing)
3. **Preferences tab** - UX preferences (new)
4. **Notifications tab** - Email/push settings (future-ready)
5. **Database schema** for user preferences

---

## Unified Settings Architecture

> **Key Insight:** The app has 4 distinct settings contexts. This PRD establishes a shared architecture that applies to ALL of them.

### Settings Contexts

| Context | Scope | Who Can Edit | Current Location |
|---------|-------|--------------|------------------|
| **User Preferences** | Per-user | User | `/settings/profile` (to be expanded) |
| **League Settings** | Per-league | Admin/Owner | `/league/[id]/settings` |
| **League Rules** | Per-league | Owner only | `/league/[id]/settings` |
| **SuperAdmin** | App-wide | SuperAdmin | `/admin/*` pages |

### Shared Component Pattern

All settings contexts use the same components:

```
src/components/settings/
├── SettingsLayout.tsx       # Sidebar + content (reusable across contexts)
├── SettingsNav.tsx          # Tab navigation (accepts sections config)
├── SettingsSection.tsx      # Group wrapper (title, description, children)
├── SettingsField.tsx        # Individual field (label, input, help text)
├── SettingsToggle.tsx       # Boolean switch field
├── SettingsSelect.tsx       # Dropdown field
├── SettingsRadioGroup.tsx   # Radio options field
└── index.ts                 # Re-exports all
```

**Usage across contexts:**

```tsx
// User Settings
<SettingsLayout context="user">
  <SettingsSection title="Navigation" description="Control app flow">
    <SettingsSelect field="default_landing" options={landingOptions} />
  </SettingsSection>
</SettingsLayout>

// League Settings (same components!)
<SettingsLayout context="league" entityId={leagueId}>
  <SettingsSection title="Competition" description="Step counting rules">
    <SettingsField field="counting_start_date" type="date" />
  </SettingsSection>
</SettingsLayout>
```

### Settings Registry Pattern (Extensible)

Each context has its own registry, but they share the same schema:

```typescript
// src/lib/settings/types.ts
interface SettingDefinition {
  key: string;
  type: 'text' | 'select' | 'toggle' | 'radio' | 'date' | 'number';
  label: string;
  description?: string;
  options?: { value: string; label: string }[];
  default: unknown;
  requiredRole?: 'member' | 'admin' | 'owner' | 'superadmin';
}

interface SettingsSection {
  id: string;
  title: string;
  description?: string;
  settings: SettingDefinition[];
}
```

**Registry files:**

| Context | Registry File |
|---------|---------------|
| User | `src/lib/settings/userPreferences.ts` |
| League | `src/lib/settings/leagueSettings.ts` |
| SuperAdmin | `src/lib/settings/adminSettings.ts` |

### URL Structure

```
/settings                  # User settings (default)
├── /profile              # Name, nickname, avatar
├── /preferences          # App behavior
└── /notifications        # Email/push (future)

/league/[id]/settings      # League settings (existing, enhanced)
├── /general              # Name, description, week start
├── /competition          # Start date, daily goal
├── /rules                # Manual entry, photo required
└── /danger               # Delete league

/admin                     # SuperAdmin (existing)
├── /kanban               # Internal tasks
├── /feedback             # User feedback
├── /design-system        # Component docs
└── /settings (future)    # App-wide settings
```

### Component Structure

```
src/components/settings/
├── SettingsLayout.tsx      # Sidebar + content layout
├── SettingsNav.tsx         # Tab navigation
├── SettingsSection.tsx     # Reusable section wrapper
├── SettingsField.tsx       # Generic field component
├── ProfileSettings.tsx     # User: Name, nickname
├── PreferenceSettings.tsx  # User: UX preferences
└── NotificationSettings.tsx # User: Future
```

### shadcn Integration (from PRD 21)

Settings components use shadcn primitives for consistency:

| Settings Component | shadcn Primitive |
|--------------------|------------------|
| `SettingsField` (text) | `Input` (PRD 21-F) |
| `SettingsSelect` | `Select` (PRD 21-F) |
| `SettingsToggle` | `Switch` (`npx shadcn@latest add switch`) |
| `SettingsRadioGroup` | `RadioGroup` (`npx shadcn@latest add radio-group`) |
| Save confirmation | `toast()` (PRD 21-A) |
| Dangerous actions | `Dialog` (PRD 21-B) |

**Dependency:** PRD 21 Parts A, B, F should be completed first.

---

## What is Needed

### 1. `SettingsSection` Component

Reusable wrapper for each settings group:

```tsx
interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

// Usage
<SettingsSection title="Default Landing Page" description="Where to go after login">
  <RadioGroup options={landingOptions} />
</SettingsSection>
```

### 2. Database: User Preferences Table

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Display preferences
  default_landing TEXT DEFAULT 'dashboard',  -- 'dashboard' | 'submit' | 'progress' | 'rankings'
  primary_league_id UUID REFERENCES leagues(id),  -- Which league for direct links
  
  -- Reminder preferences
  reminder_style TEXT DEFAULT 'floating',  -- 'floating' | 'badge' | 'card'
  reminder_dismissed_until TIMESTAMPTZ,  -- Dismiss until next day
  
  -- Theme preferences (future)
  theme TEXT DEFAULT 'dark',  -- 'dark' | 'light' | 'system'
  
  -- Notification preferences (future)
  email_daily_reminder BOOLEAN DEFAULT false,
  email_weekly_digest BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER update_user_preferences_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. API Endpoint

```
GET/PATCH /api/user/preferences
```

Returns/updates user preferences with proper defaults.

### 4. Preferences Settings Page

`/settings/preferences` showing:

| Section | Settings |
|---------|----------|
| **Navigation** | Default landing page, Primary league |
| **Reminders** | Reminder display style |
| **Appearance** | Theme (when light mode added) |

### 5. Hook: `usePreferences`

```typescript
const { preferences, updatePreference, isLoading } = usePreferences();

// preferences.default_landing
// preferences.reminder_style
// updatePreference('reminder_style', 'badge')
```

---

## Settings Registry Pattern

For future extensibility, settings are defined in a registry:

```typescript
// src/lib/settings/registry.ts
export const PREFERENCE_SECTIONS = [
  {
    id: 'navigation',
    title: 'Navigation',
    description: 'Control your app flow',
    settings: [
      {
        key: 'default_landing',
        type: 'select',
        label: 'Default Landing Page',
        options: [
          { value: 'dashboard', label: 'My Leagues' },
          { value: 'submit', label: 'Submit Steps' },
          { value: 'progress', label: 'My Progress' },
          { value: 'rankings', label: 'League Rankings' },
        ],
        default: 'dashboard',
      },
      {
        key: 'primary_league_id',
        type: 'league_select',
        label: 'Primary League',
        description: 'Used for quick links',
      },
    ],
  },
  {
    id: 'reminders',
    title: 'Step Reminders',
    settings: [
      {
        key: 'reminder_style',
        type: 'radio',
        label: 'Reminder Display',
        options: [
          { value: 'floating', label: 'Floating button', description: 'Always visible in corner' },
          { value: 'badge', label: 'Badge only', description: 'Subtle dot on league cards' },
          { value: 'card', label: 'Card in hub', description: 'Shows on league page only' },
        ],
        default: 'floating',
      },
    ],
  },
];
```

Adding a new setting = add to registry + add column to database.

---

## Visual Design

### Settings Layout

```
┌─────────────────────────────────────────────────┐
│ Settings                        ← Dashboard     │
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────────────────┐ │
│ │ Profile │ │                                 │ │
│ │ ──────  │ │  Default Landing Page           │ │
│ │ Prefer- │ │  ────────────────────           │ │
│ │  ences  │ │  Where to go after login        │ │
│ │ ──────  │ │                                 │ │
│ │ Notifi- │ │  ○ My Leagues (Dashboard)       │ │
│ │ cations │ │  ● Submit Steps                 │ │
│ │         │ │  ○ My Progress                  │ │
│ │         │ │  ○ League Rankings              │ │
│ │         │ │                                 │ │
│ │         │ │  ─────────────────────────────  │ │
│ │         │ │                                 │ │
│ │         │ │  Step Reminders                 │ │
│ │         │ │  ────────────────────           │ │
│ └─────────┘ │  ○ Floating button              │ │
│             │  ● Badge only (subtle)          │ │
│             │  ○ Card in league hub           │ │
│             └─────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Mobile: Stacked tabs

```
┌─────────────────────────────┐
│ Settings             ← Back │
├─────────────────────────────┤
│ [Profile] [Preferences] ... │  ← Horizontal scroll
├─────────────────────────────┤
│ Default Landing Page        │
│ ────────────────────        │
│ ○ My Leagues                │
│ ● Submit Steps              │
│ ○ My Progress               │
│ ○ League Rankings           │
│                             │
│ Step Reminders              │
│ ────────────────────        │
│ ○ Floating button           │
│ ● Badge only                │
│ ○ Card in league hub        │
└─────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_create_user_preferences.sql` | **NEW** |
| `src/types/database.ts` | **MODIFY** - Add user_preferences type |
| `src/lib/settings/registry.ts` | **NEW** - Settings definitions |
| `src/hooks/usePreferences.ts` | **NEW** - Preferences hook |
| `src/app/api/user/preferences/route.ts` | **NEW** - API endpoint |
| `src/components/settings/SettingsLayout.tsx` | **NEW** |
| `src/components/settings/SettingsSection.tsx` | **NEW** |
| `src/components/settings/PreferenceSettings.tsx` | **NEW** |
| `src/app/settings/page.tsx` | **MODIFY** - Redirect to /settings/profile |
| `src/app/settings/profile/page.tsx` | **MODIFY** - Use SettingsLayout |
| `src/app/settings/preferences/page.tsx` | **NEW** |
| `/admin/design-system` | **MODIFY** - Document SettingsSection |

---

## Integration with Other PRDs

| PRD | Setting Added |
|-----|---------------|
| PRD 23 | `reminder_style` (floating/badge/card) |
| PRD 24 | `default_landing`, `primary_league_id` |
| Future | `theme`, `email_*`, `push_enabled` |

---

## Success Criteria

- [ ] `user_preferences` table created with all columns
- [ ] Settings page has tabbed navigation
- [ ] `SettingsSection` component documented in design system
- [ ] `usePreferences` hook works for get/update
- [ ] Reminder style preference respected by MissingStepReminder
- [ ] Default landing preference respected on login
- [ ] Adding new settings only requires registry + database change
- [ ] Mobile-responsive
- [ ] Build passes (`npm run build`)

---

## Proactive Enhancements

### 1. Settings Search

As the settings list grows, add search/filter:
- Search bar at top of settings page
- Filters settings as you type
- Highlights matching text in results

### 2. Reset to Defaults

One-click reset all preferences:
- "Reset all to defaults" button at bottom
- Confirmation dialog before reset
- Shows what will change before confirming

---

## Theme Awareness

All UI components must:
- Use CSS variables (`--background`, `--foreground`, etc.) from PRD 21
- Work in both light and dark modes (PRD 21 Part G)
- Avoid hardcoded colors
- Test in both themes before marking complete

---

## Out of Scope

- Account deletion
- Password change (handled by Supabase Auth)
- Export user data
- Admin override of user preferences

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for modular User Preferences System |
