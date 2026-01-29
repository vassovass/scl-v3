-- PRD-56: Sharing Encouragement System - Notification Types
-- Migration: 20260130200000_prd56_notification_types.sql
--
-- This migration adds share-specific notification types to the
-- existing notification infrastructure (PRD-38).
--
-- Notification Types:
-- - share_streak_milestone: Celebrate streak achievements
-- - share_streak_at_risk: Warn about expiring streaks
-- - share_weekly_summary: Weekly sharing recap

-- ============================================================================
-- Insert Share Notification Types
-- ============================================================================

INSERT INTO notification_types (id, name, category, description, supports_email, supports_push, supports_in_app)
VALUES
    (
        'share_streak_milestone',
        'Share Streak Milestone',
        'achievement',
        'Celebrate when reaching a share streak milestone (7, 14, 30, 100 days)',
        false,
        true,
        true
    ),
    (
        'share_streak_at_risk',
        'Share Streak At Risk',
        'engagement',
        'Remind users when their share streak is about to expire',
        false,
        true,
        true
    ),
    (
        'share_weekly_summary',
        'Share Weekly Summary',
        'insights',
        'Weekly summary of sharing activity and patterns',
        true,
        false,
        true
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    supports_email = EXCLUDED.supports_email,
    supports_push = EXCLUDED.supports_push,
    supports_in_app = EXCLUDED.supports_in_app;

-- ============================================================================
-- Insert Default Global Settings for New Types
-- ============================================================================

INSERT INTO notification_settings_global (notification_type_id, enabled, settings)
VALUES
    (
        'share_streak_milestone',
        true,
        '{"milestones": [7, 14, 30, 100], "show_confetti": true}'::jsonb
    ),
    (
        'share_streak_at_risk',
        true,
        '{"hours_before_reset": 20, "max_nudges_per_day": 2}'::jsonb
    ),
    (
        'share_weekly_summary',
        true,
        '{"send_day": "monday", "send_hour": 9}'::jsonb
    )
ON CONFLICT (notification_type_id) DO UPDATE SET
    settings = EXCLUDED.settings;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN notification_settings_global.settings IS 'PRD-56 added share streak settings: milestones array, hours_before_reset, max_nudges_per_day';
