-- PRD-56: Sharing Encouragement System - Share Streak Tracking
-- Migration: 20260130000000_prd56_share_streaks.sql
--
-- This migration creates:
-- 1. share_streaks table - Tracks current/longest streak per user
-- 2. update_share_streak() function - Called on each share to update streaks
-- 3. RLS policies for user privacy
--
-- Milestones: 7, 14, 30, 100 days (STREAK_MILESTONES constant)

-- ============================================================================
-- Table: share_streaks
-- ============================================================================

CREATE TABLE IF NOT EXISTS share_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_share_date DATE,
    total_shares INTEGER DEFAULT 0 NOT NULL,
    shares_this_week INTEGER DEFAULT 0 NOT NULL,
    week_start DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for weekly leaderboard queries (top sharers this week)
CREATE INDEX IF NOT EXISTS idx_share_streaks_weekly
    ON share_streaks(shares_this_week DESC);

-- Index for longest streak leaderboard
CREATE INDEX IF NOT EXISTS idx_share_streaks_longest
    ON share_streaks(longest_streak DESC);

-- Comment on table
COMMENT ON TABLE share_streaks IS 'PRD-56: Tracks share streak data per user for encouragement system';

-- ============================================================================
-- Function: update_share_streak(p_user_id UUID)
-- ============================================================================
-- Returns: TABLE(new_streak, is_milestone, milestone_value)
--
-- Logic:
-- - If last_share_date is NULL or >36 hours ago: reset streak to 1
-- - If last_share_date is yesterday: increment streak
-- - If last_share_date is today: no change (already shared today)
-- - Check milestones: 7, 14, 30, 100
-- - Update longest_streak if current > longest
-- - Track weekly totals (resets on Monday)

CREATE OR REPLACE FUNCTION update_share_streak(p_user_id UUID)
RETURNS TABLE(
    new_streak INTEGER,
    is_milestone BOOLEAN,
    milestone_value INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_last_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
    v_week_start DATE;
    v_stored_week_start DATE;
    v_shares_this_week INTEGER;
    v_is_milestone BOOLEAN := FALSE;
    v_milestone_value INTEGER := 0;
    v_days_since_last INTEGER;
BEGIN
    -- Get current record (if exists)
    SELECT
        last_share_date,
        current_streak,
        longest_streak,
        week_start,
        shares_this_week
    INTO
        v_last_date,
        v_current_streak,
        v_longest_streak,
        v_stored_week_start,
        v_shares_this_week
    FROM share_streaks
    WHERE user_id = p_user_id;

    -- Initialize defaults if no record found
    IF NOT FOUND THEN
        v_current_streak := 0;
        v_longest_streak := 0;
        v_shares_this_week := 0;
    END IF;

    -- Calculate days since last share (if any)
    IF v_last_date IS NOT NULL THEN
        v_days_since_last := v_today - v_last_date;
    ELSE
        v_days_since_last := 999; -- Force new streak on first share
    END IF;

    -- Determine new streak value
    IF v_last_date IS NULL OR v_days_since_last > 1 THEN
        -- First share ever OR streak broken (gap > 1 day)
        -- Using > 1 day instead of strict 24h to be timezone-friendly
        v_current_streak := 1;
    ELSIF v_days_since_last = 1 THEN
        -- Consecutive day - increment streak
        v_current_streak := v_current_streak + 1;
    END IF;
    -- If v_days_since_last = 0 (same day), streak stays the same

    -- Check for milestones (7, 14, 30, 100)
    IF v_current_streak IN (7, 14, 30, 100) THEN
        -- Only trigger milestone if we just reached it (not if already past)
        IF v_days_since_last > 0 THEN
            v_is_milestone := TRUE;
            v_milestone_value := v_current_streak;
        END IF;
    END IF;

    -- Update longest streak if current exceeds it
    IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
    END IF;

    -- Calculate week start (Monday of current week)
    -- date_trunc('week', date) returns Monday in PostgreSQL with default ISO week
    v_week_start := date_trunc('week', v_today)::DATE;

    -- Determine shares_this_week
    IF v_stored_week_start IS NULL OR v_stored_week_start < v_week_start THEN
        -- New week - reset counter
        v_shares_this_week := 1;
    ELSIF v_last_date IS NULL OR v_last_date < v_today THEN
        -- Same week, different day - increment
        v_shares_this_week := COALESCE(v_shares_this_week, 0) + 1;
    END IF;
    -- Same day, same week - no increment for weekly counter

    -- Upsert the record
    INSERT INTO share_streaks (
        user_id,
        current_streak,
        longest_streak,
        last_share_date,
        total_shares,
        shares_this_week,
        week_start,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_current_streak,
        v_longest_streak,
        v_today,
        1,
        v_shares_this_week,
        v_week_start,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_share_date = v_today,
        total_shares = share_streaks.total_shares + CASE
            WHEN share_streaks.last_share_date < v_today OR share_streaks.last_share_date IS NULL
            THEN 1
            ELSE 0
        END,
        shares_this_week = v_shares_this_week,
        week_start = v_week_start,
        updated_at = NOW();

    -- Return results
    RETURN QUERY SELECT v_current_streak, v_is_milestone, v_milestone_value;
END;
$$;

COMMENT ON FUNCTION update_share_streak(UUID) IS 'PRD-56: Updates share streak for a user after each share. Returns new streak and milestone info.';

-- ============================================================================
-- Function: get_share_streak(p_user_id UUID)
-- ============================================================================
-- Simple getter function for streak data

CREATE OR REPLACE FUNCTION get_share_streak(p_user_id UUID)
RETURNS TABLE(
    current_streak INTEGER,
    longest_streak INTEGER,
    last_share_date DATE,
    total_shares INTEGER,
    shares_this_week INTEGER,
    streak_at_risk BOOLEAN,
    hours_until_reset NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_streak share_streaks%ROWTYPE;
    v_hours_since NUMERIC;
BEGIN
    SELECT * INTO v_streak
    FROM share_streaks
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        -- Return defaults for user with no shares
        RETURN QUERY SELECT
            0::INTEGER,
            0::INTEGER,
            NULL::DATE,
            0::INTEGER,
            0::INTEGER,
            FALSE::BOOLEAN,
            NULL::NUMERIC;
        RETURN;
    END IF;

    -- Calculate hours since last share
    IF v_streak.last_share_date IS NOT NULL THEN
        v_hours_since := EXTRACT(EPOCH FROM (NOW() - (v_streak.last_share_date + INTERVAL '1 day'))) / 3600;
    ELSE
        v_hours_since := 999;
    END IF;

    RETURN QUERY SELECT
        v_streak.current_streak,
        v_streak.longest_streak,
        v_streak.last_share_date,
        v_streak.total_shares,
        v_streak.shares_this_week,
        -- Streak is at risk if >20 hours since midnight of last_share_date
        -- (meaning user has <4 hours left to maintain streak)
        (v_hours_since > 20)::BOOLEAN,
        -- Hours until streak resets (midnight tomorrow after last_share_date)
        GREATEST(0, 24 - v_hours_since)::NUMERIC;
END;
$$;

COMMENT ON FUNCTION get_share_streak(UUID) IS 'PRD-56: Gets share streak data for a user including at-risk status.';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE share_streaks ENABLE ROW LEVEL SECURITY;

-- Users can read their own streak data
CREATE POLICY "Users can view own share streak"
    ON share_streaks
    FOR SELECT
    USING (auth.uid() = user_id);

-- No direct insert/update/delete - must go through functions
-- Functions use SECURITY DEFINER to bypass RLS

-- ============================================================================
-- Grants
-- ============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION update_share_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_share_streak(UUID) TO authenticated;

-- Grant select on table to authenticated (via RLS)
GRANT SELECT ON share_streaks TO authenticated;

-- Service role can do everything (for admin operations)
GRANT ALL ON share_streaks TO service_role;
