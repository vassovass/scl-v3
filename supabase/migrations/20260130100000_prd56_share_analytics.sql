-- PRD-56: Sharing Encouragement System - Share Analytics
-- Migration: 20260130100000_prd56_share_analytics.sql
--
-- This migration creates:
-- 1. share_analytics_daily table - Tracks sharing patterns (day of week, hour)
-- 2. Helper functions for pattern analysis
--
-- Used for:
-- - "Best share day" insights
-- - Week-over-week comparisons
-- - Smart timing suggestions

-- ============================================================================
-- Table: share_analytics_daily
-- ============================================================================

CREATE TABLE IF NOT EXISTS share_analytics_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23), -- 0-23
    shares_count INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, share_date, hour_of_day)
);

-- Index for pattern analysis queries
CREATE INDEX IF NOT EXISTS idx_share_analytics_user_dow
    ON share_analytics_daily(user_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_share_analytics_user_hour
    ON share_analytics_daily(user_id, hour_of_day);

CREATE INDEX IF NOT EXISTS idx_share_analytics_user_date
    ON share_analytics_daily(user_id, share_date DESC);

-- Comment on table
COMMENT ON TABLE share_analytics_daily IS 'PRD-56: Tracks daily sharing patterns for insights and nudge timing';

-- ============================================================================
-- Function: record_share_analytics(p_user_id UUID)
-- ============================================================================
-- Records the current share timestamp for pattern analysis
-- Called from share creation flow alongside update_share_streak()

CREATE OR REPLACE FUNCTION record_share_analytics(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_date DATE := v_now::DATE;
    v_dow INTEGER := EXTRACT(DOW FROM v_now)::INTEGER; -- 0=Sunday
    v_hour INTEGER := EXTRACT(HOUR FROM v_now)::INTEGER;
BEGIN
    INSERT INTO share_analytics_daily (
        user_id,
        share_date,
        day_of_week,
        hour_of_day,
        shares_count,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_date,
        v_dow,
        v_hour,
        1,
        v_now,
        v_now
    )
    ON CONFLICT (user_id, share_date, hour_of_day) DO UPDATE SET
        shares_count = share_analytics_daily.shares_count + 1,
        updated_at = v_now;
END;
$$;

COMMENT ON FUNCTION record_share_analytics(UUID) IS 'PRD-56: Records share timestamp for pattern analysis';

-- ============================================================================
-- Function: get_share_patterns(p_user_id UUID, p_days INTEGER)
-- ============================================================================
-- Returns aggregated sharing patterns for a user over the last N days

CREATE OR REPLACE FUNCTION get_share_patterns(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    day_of_week INTEGER,
    day_name TEXT,
    hour_of_day INTEGER,
    total_shares BIGINT,
    avg_shares_per_day NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH day_names AS (
        SELECT 0 AS dow, 'Sunday'::TEXT AS name UNION ALL
        SELECT 1, 'Monday' UNION ALL
        SELECT 2, 'Tuesday' UNION ALL
        SELECT 3, 'Wednesday' UNION ALL
        SELECT 4, 'Thursday' UNION ALL
        SELECT 5, 'Friday' UNION ALL
        SELECT 6, 'Saturday'
    )
    SELECT
        a.day_of_week,
        d.name AS day_name,
        a.hour_of_day,
        SUM(a.shares_count)::BIGINT AS total_shares,
        ROUND(SUM(a.shares_count)::NUMERIC / GREATEST(COUNT(DISTINCT a.share_date), 1), 2) AS avg_shares_per_day
    FROM share_analytics_daily a
    JOIN day_names d ON d.dow = a.day_of_week
    WHERE a.user_id = p_user_id
      AND a.share_date >= CURRENT_DATE - p_days
    GROUP BY a.day_of_week, d.name, a.hour_of_day
    ORDER BY total_shares DESC;
END;
$$;

COMMENT ON FUNCTION get_share_patterns(UUID, INTEGER) IS 'PRD-56: Returns sharing patterns aggregated by day and hour';

-- ============================================================================
-- Function: get_share_insights(p_user_id UUID)
-- ============================================================================
-- Returns comprehensive sharing insights for a user

CREATE OR REPLACE FUNCTION get_share_insights(p_user_id UUID)
RETURNS TABLE(
    -- Best sharing patterns
    best_day_of_week INTEGER,
    best_day_name TEXT,
    best_day_shares BIGINT,
    best_hour_of_day INTEGER,
    best_hour_shares BIGINT,
    -- Weekly comparison
    shares_this_week BIGINT,
    shares_last_week BIGINT,
    week_over_week_pct NUMERIC,
    -- Totals
    total_shares_30d BIGINT,
    total_days_shared_30d BIGINT,
    avg_shares_per_active_day NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
    v_last_week_start DATE := v_week_start - INTERVAL '7 days';
BEGIN
    RETURN QUERY
    WITH day_names AS (
        SELECT 0 AS dow, 'Sunday'::TEXT AS name UNION ALL
        SELECT 1, 'Monday' UNION ALL
        SELECT 2, 'Tuesday' UNION ALL
        SELECT 3, 'Wednesday' UNION ALL
        SELECT 4, 'Thursday' UNION ALL
        SELECT 5, 'Friday' UNION ALL
        SELECT 6, 'Saturday'
    ),
    best_day AS (
        SELECT
            a.day_of_week,
            d.name AS day_name,
            SUM(a.shares_count) AS total
        FROM share_analytics_daily a
        JOIN day_names d ON d.dow = a.day_of_week
        WHERE a.user_id = p_user_id
          AND a.share_date >= CURRENT_DATE - 30
        GROUP BY a.day_of_week, d.name
        ORDER BY total DESC
        LIMIT 1
    ),
    best_hour AS (
        SELECT
            a.hour_of_day,
            SUM(a.shares_count) AS total
        FROM share_analytics_daily a
        WHERE a.user_id = p_user_id
          AND a.share_date >= CURRENT_DATE - 30
        GROUP BY a.hour_of_day
        ORDER BY total DESC
        LIMIT 1
    ),
    this_week AS (
        SELECT COALESCE(SUM(shares_count), 0) AS total
        FROM share_analytics_daily
        WHERE user_id = p_user_id
          AND share_date >= v_week_start
    ),
    last_week AS (
        SELECT COALESCE(SUM(shares_count), 0) AS total
        FROM share_analytics_daily
        WHERE user_id = p_user_id
          AND share_date >= v_last_week_start
          AND share_date < v_week_start
    ),
    totals AS (
        SELECT
            COALESCE(SUM(shares_count), 0) AS total_30d,
            COUNT(DISTINCT share_date) AS days_30d
        FROM share_analytics_daily
        WHERE user_id = p_user_id
          AND share_date >= CURRENT_DATE - 30
    )
    SELECT
        COALESCE(bd.day_of_week, 0)::INTEGER,
        COALESCE(bd.day_name, 'N/A')::TEXT,
        COALESCE(bd.total, 0)::BIGINT,
        COALESCE(bh.hour_of_day, 12)::INTEGER,
        COALESCE(bh.total, 0)::BIGINT,
        tw.total::BIGINT,
        lw.total::BIGINT,
        CASE
            WHEN lw.total > 0 THEN ROUND(((tw.total - lw.total)::NUMERIC / lw.total) * 100, 1)
            WHEN tw.total > 0 THEN 100.0
            ELSE 0.0
        END::NUMERIC,
        t.total_30d::BIGINT,
        t.days_30d::BIGINT,
        CASE
            WHEN t.days_30d > 0 THEN ROUND(t.total_30d::NUMERIC / t.days_30d, 2)
            ELSE 0.0
        END::NUMERIC
    FROM totals t
    CROSS JOIN this_week tw
    CROSS JOIN last_week lw
    LEFT JOIN best_day bd ON TRUE
    LEFT JOIN best_hour bh ON TRUE;
END;
$$;

COMMENT ON FUNCTION get_share_insights(UUID) IS 'PRD-56: Returns comprehensive sharing insights for dashboard';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE share_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Users can read their own analytics data
CREATE POLICY "Users can view own share analytics"
    ON share_analytics_daily
    FOR SELECT
    USING (auth.uid() = user_id);

-- No direct insert/update/delete - must go through functions
-- Functions use SECURITY DEFINER to bypass RLS

-- ============================================================================
-- Grants
-- ============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION record_share_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_share_patterns(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_share_insights(UUID) TO authenticated;

-- Grant select on table to authenticated (via RLS)
GRANT SELECT ON share_analytics_daily TO authenticated;

-- Service role can do everything (for admin operations)
GRANT ALL ON share_analytics_daily TO service_role;
