---
Order: 38
Title: Notification Infrastructure
Status: Draft
Previous: PRD_37_In_App_Chat
Next: null
Created: 2026-01-10
---

# PRD 38: Notification Infrastructure

## Overview

Multi-layer notification system with cascading priority:
- **Global** (SuperAdmin) → Platform defaults & overrides
- **League** (Owner/Admin) → Per-league rules
- **User** (Personal) → Individual preferences

## Problem Statement

Users need configurable notifications about:
- Missing step submissions (yesterday, multiple days)
- Streak milestones and risks
- League activity (rankings, new members)
- Personal achievements

---

## Database Schema

### 1. `notification_types` (Reference Table)

Defines all notification types available in the system.

```sql
CREATE TABLE notification_types (
    id TEXT PRIMARY KEY,  -- e.g., 'submission_reminder', 'streak_milestone'
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,  -- 'engagement', 'achievement', 'social', 'admin'
    default_enabled BOOLEAN DEFAULT true,
    supports_email BOOLEAN DEFAULT false,
    supports_push BOOLEAN DEFAULT false,
    supports_in_app BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO notification_types (id, name, category, description) VALUES
    ('submission_reminder', 'Submission Reminder', 'engagement', 'Remind user about missing step submissions'),
    ('streak_milestone', 'Streak Milestone', 'achievement', 'Celebrate streak achievements'),
    ('streak_at_risk', 'Streak At Risk', 'engagement', 'Warn when streak may break'),
    ('ranking_change', 'Ranking Change', 'social', 'Notify ranking position changes'),
    ('league_activity', 'League Activity', 'social', 'New members, high-fives, etc.'),
    ('weekly_summary', 'Weekly Summary', 'engagement', 'Weekly stats digest');
```

### 2. `notification_settings_global` (SuperAdmin)

Platform-wide defaults and overrides.

```sql
CREATE TABLE notification_settings_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type_id TEXT REFERENCES notification_types(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',  -- Type-specific settings
    lock_to_global BOOLEAN DEFAULT false,  -- Prevent league/user override
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notification_type_id)
);

-- submission_reminder settings example:
-- {
--   "default_days": 7,
--   "presets": [
--     { "id": "yesterday_only", "label": "Yesterday Only", "days": 1 },
--     { "id": "three_days", "label": "Last 3 Days", "days": 3 },
--     { "id": "week", "label": "Last Week", "days": 7 },
--     { "id": "two_weeks", "label": "Last 2 Weeks", "days": 14 }
--   ]
-- }
```

### 3. `notification_settings_league` (League Level)

Per-league notification configuration.

```sql
CREATE TABLE notification_settings_league (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    notification_type_id TEXT REFERENCES notification_types(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    lock_for_members BOOLEAN DEFAULT false,  -- Prevent user override
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, notification_type_id)
);
```

### 4. `notification_preferences_user` (User Level)

Individual user preferences.

```sql
CREATE TABLE notification_preferences_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type_id TEXT REFERENCES notification_types(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    channels JSONB DEFAULT '{"in_app": true, "email": false, "push": false}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type_id)
);
```

### 5. `notification_preferences_user_league` (Per-League User Override)

User can override preferences for specific leagues.

```sql
CREATE TABLE notification_preferences_user_league (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    notification_type_id TEXT REFERENCES notification_types(id) ON DELETE CASCADE,
    enabled BOOLEAN,  -- NULL = inherit from user level
    settings JSONB DEFAULT '{}',
    UNIQUE(user_id, league_id, notification_type_id)
);
```

### 6. `notifications` (Notification Queue/Log)

Stores sent notifications for history and future delivery.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type_id TEXT REFERENCES notification_types(id),
    league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    channels JSONB DEFAULT '{"in_app": true}',
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread 
    ON notifications(user_id, read_at) 
    WHERE read_at IS NULL;
```

---

## Implementation Phases

### Phase 1: Foundation (Current Scope)
- [ ] Database migration with all tables
- [ ] `submission_reminder` type implementation
- [ ] Basic gap analysis API
- [ ] League settings UI

### Phase 2: User Preferences
- [ ] User notification preferences page
- [ ] Per-league user overrides
- [ ] Notification history/log

### Phase 3: In-App Notification Center
- [ ] Bell icon with unread count
- [ ] Notification dropdown/panel
- [ ] Mark as read/dismiss

### Phase 4: Email Notifications
- [ ] Email templates
- [ ] Delivery queue
- [ ] Unsubscribe handling

### Phase 5: Push Notifications
- [ ] Web push integration
- [ ] Device token management
- [ ] Delivery tracking

---

## Notification Center UI (Global)

Based on UX research, the notification center should be accessible from anywhere via a bell icon in the header.

### Component Architecture

```
┌────────────────────────────────────────────────────────┐
│  NavHeader                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Logo   | Nav Items  |  🔔❷  | User Menu         │   │
│  │                      └──┬──┘                     │   │
│  └───────────────────────┼──────────────────────────┘   │
│                          │                              │
│  ┌───────────────────────▼────────────────────────────┐ │
│  │  NotificationPanel (Dropdown)                      │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │ Notifications           Mark all as read    │   │ │
│  │  ├─────────────────────────────────────────────┤   │ │
│  │  │ 🔴 Missing steps for Jan 8, 9      2h ago   │   │ │
│  │  │    Quick tap to catch up →                  │   │ │
│  │  ├─────────────────────────────────────────────┤   │ │
│  │  │ ○ You moved to #2 in FitFam!     Yesterday  │   │ │
│  │  │    View leaderboard →                       │   │ │
│  │  ├─────────────────────────────────────────────┤   │ │
│  │  │ ○ 🏆 7-day streak achieved!       3d ago    │   │ │
│  │  ├─────────────────────────────────────────────┤   │ │
│  │  │           View all notifications →          │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Component Files

| Component | Description |
|-----------|-------------|
| `NotificationBell.tsx` | Bell icon + unread badge |
| `NotificationPanel.tsx` | Dropdown panel with list |
| `NotificationItem.tsx` | Single notification row |
| `NotificationProvider.tsx` | Context for real-time updates |
| `useNotifications.ts` | Hook for fetching/managing |

### UX Best Practices (Research)

| Practice | Implementation |
|----------|----------------|
| **Unread badge** | Red dot/number at top-right of bell |
| **Read/unread distinction** | Filled vs outlined dot indicator |
| **Actionable** | Each notification has CTA link |
| **Non-disruptive** | Dropdown, not modal |
| **Mark as read** | Bulk + individual actions |
| **Timestamp** | Relative time ("2h ago") |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | User's notifications |
| GET | `/api/notifications/settings` | Effective settings for user |
| PUT | `/api/notifications/preferences` | Update user preferences |
| GET | `/api/submissions/gaps` | Gap analysis with notification |
| GET/PUT | `/api/admin/notifications/global` | SuperAdmin global settings |
| GET/PUT | `/api/leagues/[id]/notifications` | League notification settings |

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-10 | Initial | PRD created with database schema |
