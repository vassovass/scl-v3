-- Migration: Fix submission uniqueness constraints to support proxies
-- Created: 2026-01-13
-- Purpose: Allow a user to have their own submission AND submit for proxies on the same date/league.
-- Previously, a unique constraint on (league_id, user_id, for_date) likely prevented this.

-- Drop existing constraints (trying potential names)
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_league_id_user_id_for_date_key;
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submission_unique_date; -- Common legacy name
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_user_id_league_id_for_date_key; -- Also possible

-- Create granular unique indexes instead
-- 1. Uniqueness for the User's own submissions (proxy_member_id is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_unique_user 
    ON public.submissions(user_id, league_id, for_date) 
    WHERE proxy_member_id IS NULL;

-- 2. Uniqueness for Proxy submissions (one per proxy per league per date)
-- Note: We use proxy_member_id instead of user_id here, because ANY admin could potentially submit for a proxy.
-- The uniqueness describes the PROXY'S timeline, not who submitted it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_unique_proxy 
    ON public.submissions(proxy_member_id, league_id, for_date) 
    WHERE proxy_member_id IS NOT NULL;
