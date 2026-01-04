# PRD 23: SuperAdmin Settings & Feature Flags

> **Order:** 23 of 30  
> **Previous:** [PRD 22: User Preferences](./PRD_22_User_Preferences.md)  
> **Next:** [PRD 24: League Hub](./PRD_24_League_Hub.md)  
> **Status:** 📋 Proposed

> [!IMPORTANT]
> **Feature Flag Dependency**: PRDs 25, 27, 28 are gated by feature flags defined here. If building features before this PRD, use fallback defaults: `getSetting('feature_xyz', true)`.

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/types/database.ts` - Existing `site_settings` table
   - PRD 25 (User Preferences) - Unified settings architecture
   - `src/app/admin/` - Existing admin pages

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

3. **After completion:**
   - Commit with message format: `feat(PRD-28): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**Current:**
- App-wide limits are hardcoded (e.g., `MAX_UPLOADS = 5`)
- No way for SuperAdmin to configure app behavior without code changes
- No system to propagate settings to league admins or users
- No visibility controls (who can see what settings)

**Needed:**
- Configurable app-wide settings
- Settings cascade (SuperAdmin → League Admin → User)
- Visibility controls per setting per user level

---

## Outcome

A **SuperAdmin Settings System** that provides:

1. **App Configuration** - Editable limits, defaults, feature flags
2. **Setting Visibility** - Control who sees what (SuperAdmin, League Owner, League Admin, User)
3. **Cascade Logic** - Settings flow from app-level to league-level to user-level
4. **Feature Flags** - Enable/disable features per environment or user segment

---

## What is Needed

### 1. Enhanced Site Settings Table

Extend existing `site_settings` table:

```sql
-- Modify existing site_settings or create app_settings
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  
  -- Metadata
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'limits', 'features', 'defaults', 'display'
  
  -- Type info for UI rendering
  value_type TEXT NOT NULL, -- 'number', 'boolean', 'string', 'select', 'json'
  value_options JSONB, -- For 'select' type: [{ value: 'a', label: 'A' }]
  value_constraints JSONB, -- { min: 1, max: 100 } for numbers
  
  -- Visibility controls
  visible_to TEXT[] DEFAULT '{superadmin}', -- Array of roles
  editable_by TEXT[] DEFAULT '{superadmin}', -- Who can edit
  show_in_league_settings BOOLEAN DEFAULT false, -- Show inherited value
  show_in_user_settings BOOLEAN DEFAULT false,
  
  -- Audit
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can do everything
CREATE POLICY "SuperAdmin full access" ON app_settings
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- Others can only read visible settings
CREATE POLICY "Users read visible settings" ON app_settings
FOR SELECT TO authenticated
USING (
  CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true) THEN true
    WHEN 'owner' = ANY(visible_to) AND EXISTS (
      SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role = 'owner'
    ) THEN true
    WHEN 'admin' = ANY(visible_to) AND EXISTS (
      SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) THEN true
    WHEN 'member' = ANY(visible_to) THEN true
    ELSE false
  END
);
```

### 2. Initial Settings Data

```sql
INSERT INTO app_settings (key, value, label, description, category, value_type, value_constraints, visible_to, show_in_league_settings) VALUES

-- Limits
('max_batch_uploads', '{"value": 5}', 'Max Batch Uploads', 'Maximum number of days that can be uploaded at once', 'limits', 'number', '{"min": 1, "max": 30}', '{superadmin, owner, admin}', true),
('max_backfill_days', '{"value": 7}', 'Max Backfill Days', 'How many days back users can submit steps', 'limits', 'number', '{"min": 1, "max": 30}', '{superadmin, owner}', true),
('max_league_members', '{"value": 50}', 'Default Max League Members', 'Default member limit for new leagues', 'defaults', 'number', '{"min": 5, "max": 1000}', '{superadmin}', false),

-- Features
('feature_high_fives', '{"enabled": true}', 'High-Fives Feature', 'Enable peer encouragement (PRD 26)', 'features', 'boolean', null, '{superadmin}', false),
('feature_streak_freeze', '{"enabled": true}', 'Streak Freeze Feature', 'Allow users to freeze streaks (PRD 23)', 'features', 'boolean', null, '{superadmin}', false),
('feature_analytics_export', '{"enabled": true}', 'Analytics Export', 'Allow CSV/PDF export from analytics', 'features', 'boolean', null, '{superadmin}', false),

-- Display
('show_global_leaderboard', '{"value": false}', 'Show Global Leaderboard', 'Display cross-league rankings', 'display', 'boolean', null, '{superadmin}', true),
('maintenance_mode', '{"enabled": false, "message": ""}', 'Maintenance Mode', 'Show maintenance banner to users', 'features', 'boolean', null, '{superadmin}', false);
```

### 3. Settings Registry (TypeScript)

```typescript
// src/lib/settings/appSettings.ts
export interface AppSetting {
  key: string;
  label: string;
  description?: string;
  category: 'limits' | 'features' | 'defaults' | 'display';
  valueType: 'number' | 'boolean' | 'string' | 'select' | 'json';
  valueOptions?: { value: string; label: string }[];
  valueConstraints?: { min?: number; max?: number };
  visibleTo: ('superadmin' | 'owner' | 'admin' | 'member')[];
  editableBy: ('superadmin' | 'owner' | 'admin')[];
  showInLeagueSettings: boolean;
  showInUserSettings: boolean;
}

export const APP_SETTINGS_REGISTRY: Record<string, AppSetting> = {
  max_batch_uploads: {
    key: 'max_batch_uploads',
    label: 'Max Batch Uploads',
    description: 'Maximum number of days that can be uploaded at once',
    category: 'limits',
    valueType: 'number',
    valueConstraints: { min: 1, max: 30 },
    visibleTo: ['superadmin', 'owner', 'admin'],
    editableBy: ['superadmin'],
    showInLeagueSettings: true,
    showInUserSettings: false,
  },
  // ... etc
};
```

### 4. Hook: useAppSettings

```typescript
// src/hooks/useAppSettings.ts
export function useAppSettings() {
  const { data, isLoading, mutate } = useSWR('/api/admin/settings');
  
  const getSetting = <T>(key: string, defaultValue: T): T => {
    return data?.settings?.[key]?.value ?? defaultValue;
  };
  
  const updateSetting = async (key: string, value: unknown) => {
    await fetch(`/api/admin/settings/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
    mutate();
  };
  
  return { settings: data?.settings, getSetting, updateSetting, isLoading };
}

// Usage
const { getSetting } = useAppSettings();
const maxUploads = getSetting('max_batch_uploads', 5);
```

### 5. SuperAdmin Settings Page

Add to `/admin/settings`:

```
┌─────────────────────────────────────────────────────────────────────┐
│ App Settings                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────────────┐ │
│ │ Categories  │ │                                                 │ │
│ │ ──────────  │ │ LIMITS                                          │ │
│ │ • Limits    │ │ ──────                                          │ │
│ │ • Features  │ │ Max Batch Uploads         [5    ] ▼             │ │
│ │ • Defaults  │ │ How many days can be uploaded at once           │ │
│ │ • Display   │ │ 👁 Visible to: SuperAdmin, Owner, Admin         │ │
│ │             │ │                                                 │ │
│ │             │ │ Max Backfill Days         [7    ] ▼             │ │
│ │             │ │ How far back users can submit                   │ │
│ │             │ │ 👁 Visible to: SuperAdmin, Owner                │ │
│ │             │ │                                                 │ │
│ └─────────────┘ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 6. Visibility Controls UI

For each setting, SuperAdmin can configure:

```tsx
<SettingsVisibility 
  setting={setting}
  onUpdate={(visibility) => updateSettingVisibility(setting.key, visibility)}
>
  <Checkbox label="Show to League Owners" checked={setting.visibleTo.includes('owner')} />
  <Checkbox label="Show to League Admins" checked={setting.visibleTo.includes('admin')} />
  <Checkbox label="Show to Members" checked={setting.visibleTo.includes('member')} />
  <Checkbox label="Display in League Settings" checked={setting.showInLeagueSettings} />
  <Checkbox label="Display in User Settings" checked={setting.showInUserSettings} />
</SettingsVisibility>
```

### 7. Cascade to League/User Settings

When `showInLeagueSettings = true`, the setting appears in League Settings as **read-only inherited value**:

```
League Settings
═══════════════
▼ Competition Rules (set by app admin)
  
  Max Batch Uploads: 5 days 🔒
  Max Backfill Days: 7 days 🔒
  
  ℹ️ These limits are set at the app level.
```

---

## API Endpoints

### GET /api/admin/settings

Returns all settings visible to current user.

### PATCH /api/admin/settings/:key

Update a setting value (SuperAdmin only).

### PATCH /api/admin/settings/:key/visibility

Update visibility settings (SuperAdmin only).

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_create_app_settings.sql` | **NEW** |
| `src/lib/settings/appSettings.ts` | **NEW** - Registry |
| `src/hooks/useAppSettings.ts` | **NEW** - Hook |
| `src/app/admin/settings/page.tsx` | **NEW** |
| `src/components/admin/settings/SettingEditor.tsx` | **NEW** |
| `src/components/admin/settings/VisibilityControls.tsx` | **NEW** |
| `src/app/api/admin/settings/route.ts` | **NEW** |
| League settings page | **MODIFY** - Show inherited settings |

---

## Integration Points

| Feature | Setting Key | Usage |
|---------|-------------|-------|
| Batch Upload | `max_batch_uploads` | Limit date picker in submission form |
| Backfill | `max_backfill_days` | Limit how far back calendar allows |
| High-Fives (PRD 26) | `feature_high_fives` | Gate entire feature |
| Streak Freeze (PRD 23) | `feature_streak_freeze` | Gate freeze option |
| Analytics Export (PRD 27) | `feature_analytics_export` | Gate export buttons |

---

## Success Criteria

- [ ] SuperAdmin can view/edit app-wide settings
- [ ] Settings organized by category
- [ ] Visibility controls work (show/hide per role)
- [ ] `useAppSettings` hook reads settings correctly
- [ ] Settings cascade to league settings (read-only display)
- [ ] Feature flags gate features correctly
- [ ] Settings changes audit logged
- [ ] Mobile-responsive
- [ ] Build passes (`npm run build`)

---

## Proactive Enhancements

### 1. Setting Change History

Audit log of all setting changes:
- Shows who changed what, when
- "Undo" button to revert last change
- Filter by date, setting, or user

### 2. Environment Presets

Save/load setting presets:
- "Dev", "Staging", "Production" profiles
- One-click apply preset
- Useful for feature rollouts

---

## Theme Awareness

All UI components must:
- Use CSS variables (`--background`, `--foreground`, etc.) from PRD 21
- Work in both light and dark modes (PRD 21 Part G)
- Avoid hardcoded colors
- Test in both themes before marking complete

---

## Out of Scope

- Per-user overrides (user-level settings are in PRD 25)
- A/B testing framework (future)
- Scheduled setting changes
- Setting change notifications to users

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for SuperAdmin Settings & Feature Flags |
