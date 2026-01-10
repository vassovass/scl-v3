-- Migration: Notification Infrastructure (PRD 38)
-- Created: 2026-01-10
-- Description: Multi-layer notification system with Global > League > User priority

-- =====================================================
-- 1. notification_types - Reference table for all notification types
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_types (
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

-- Seed initial notification types
INSERT INTO notification_types (id, name, category, description, supports_email, supports_push) VALUES
    ('submission_reminder', 'Submission Reminder', 'engagement', 'Remind user about missing step submissions', false, false),
    ('streak_milestone', 'Streak Milestone', 'achievement', 'Celebrate streak achievements (7d, 30d, etc.)', true, true),
    ('streak_at_risk', 'Streak At Risk', 'engagement', 'Warn when streak may break', false, true),
    ('ranking_change', 'Ranking Change', 'social', 'Notify when ranking position changes', false, false),
    ('league_activity', 'League Activity', 'social', 'New members, high-fives, badges', false, false),
    ('weekly_summary', 'Weekly Summary', 'engagement', 'Weekly stats digest email', true, false),
    ('high_five_received', 'High Five Received', 'social', 'Someone sent you a high five', false, true),
    ('badge_earned', 'Badge Earned', 'achievement', 'Earned a new achievement badge', true, true)
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- 2. notification_settings_global - SuperAdmin platform defaults
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_settings_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type_id TEXT REFERENCES notification_types(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    lock_to_global BOOLEAN DEFAULT false,  -- If true, leagues/users cannot override
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notification_type_id)
);

-- Insert default global settings for submission_reminder
INSERT INTO notification_settings_global (notification_type_id, enabled, settings) VALUES
    ('submission_reminder', true, '{
        "default_days": 7,
        "default_preset": "week",
        "presets": [
            { "id": "yesterday_only", "label": "Yesterday Only", "days": 1 },
            { "id": "three_days", "label": "Last 3 Days", "days": 3 },
            { "id": "week", "label": "Last Week", "days": 7 },
            { "id": "two_weeks", "label": "Last 2 Weeks", "days": 14 }
        ]
    }'),
    ('streak_milestone', true, '{
        "milestones": [7, 14, 30, 60, 100, 365]
    }'),
    ('weekly_summary', true, '{
        "send_day": "monday",
        "send_hour": 9
    }')
ON CONFLICT (notification_type_id) DO NOTHING;


-- =====================================================
-- 3. notification_settings_league - League-level settings
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_settings_league (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    notification_type_id TEXT REFERENCES notification_types(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    lock_for_members BOOLEAN DEFAULT false,  -- If true, users cannot override
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, notification_type_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_league_league 
    ON notification_settings_league(league_id);


-- =====================================================
-- 4. notification_preferences_user - User-level preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences_user (
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

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_user 
    ON notification_preferences_user(user_id);


-- =====================================================
-- 5. notification_preferences_user_league - Per-league user overrides
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences_user_league (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    notification_type_id TEXT REFERENCES notification_types(id) ON DELETE CASCADE,
    enabled BOOLEAN,  -- NULL = inherit from user level
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, league_id, notification_type_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_league_user 
    ON notification_preferences_user_league(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_league_league 
    ON notification_preferences_user_league(league_id);


-- =====================================================
-- 6. notifications - Notification queue and history
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type_id TEXT REFERENCES notification_types(id) ON DELETE SET NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
    league_name TEXT,  -- Denormalized for display (user-friendly, not ID)
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    channels JSONB DEFAULT '{"in_app": true}',
    -- Delivery tracking
    scheduled_for TIMESTAMPTZ,  -- NULL = immediate
    delivered_at TIMESTAMPTZ,
    -- User interaction
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user's unread notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON notifications(user_id, created_at DESC) 
    WHERE read_at IS NULL AND dismissed_at IS NULL;

-- Index for scheduled delivery
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled 
    ON notifications(scheduled_for) 
    WHERE delivered_at IS NULL AND scheduled_for IS NOT NULL;


-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings_league ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences_user_league ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- notification_types: Anyone can read
CREATE POLICY "notification_types_read_all" ON notification_types
    FOR SELECT TO authenticated USING (true);

-- notification_settings_global: Only SuperAdmin can modify
CREATE POLICY "notification_settings_global_read_all" ON notification_settings_global
    FOR SELECT TO authenticated USING (true);

-- notification_settings_league: League admins can modify
CREATE POLICY "notification_settings_league_read_members" ON notification_settings_league
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM memberships 
            WHERE memberships.league_id = notification_settings_league.league_id 
            AND memberships.user_id = auth.uid()
        )
    );

-- notification_preferences_user: Users can manage their own
CREATE POLICY "notification_preferences_user_own" ON notification_preferences_user
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- notification_preferences_user_league: Users can manage their own
CREATE POLICY "notification_preferences_user_league_own" ON notification_preferences_user_league
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- notifications: Users can see their own
CREATE POLICY "notifications_own" ON notifications
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
