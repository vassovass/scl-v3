-- Migration: Create get_public_stats function for PRD-56
--
-- Problem: The /api/stats/public endpoint uses adminClient to query aggregates,
-- but RLS policies on submissions check auth.uid() which returns NULL for
-- service role clients, causing stats to show zeros.
--
-- Solution: SECURITY DEFINER function bypasses RLS with explicit aggregate queries.
-- This is safe because we only return aggregated counts, never individual records.

-- ============================================================================
-- Create Function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    active_users_count INTEGER;
    leagues_count INTEGER;
    total_steps BIGINT;
    share_cards_count INTEGER;
BEGIN
    -- Count active users (submitted in last 30 days)
    -- Using COUNT(DISTINCT ...) to get unique users
    SELECT COUNT(DISTINCT user_id)
    INTO active_users_count
    FROM submissions
    WHERE for_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Count all leagues
    SELECT COUNT(*)
    INTO leagues_count
    FROM leagues;

    -- Sum all steps (using COALESCE to handle NULL)
    SELECT COALESCE(SUM(steps), 0)
    INTO total_steps
    FROM submissions;

    -- Count share cards created
    SELECT COUNT(*)
    INTO share_cards_count
    FROM share_cards;

    -- Build JSON result
    SELECT json_build_object(
        'activeUsers', active_users_count,
        'leaguesCount', leagues_count,
        'totalSteps', total_steps,
        'shareCardsCount', share_cards_count
    ) INTO result;

    RETURN result;
END;
$$;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Allow anonymous and authenticated users to call this function
-- (for the public marketing page)
GRANT EXECUTE ON FUNCTION get_public_stats() TO anon, authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION get_public_stats() IS
'Returns aggregate public statistics for marketing pages.
Safe to call without auth - only returns aggregated counts, never individual records.
PRD-56: Created to bypass RLS issues with admin client.';
