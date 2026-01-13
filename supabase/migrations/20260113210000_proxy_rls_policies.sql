-- PRD 41: RLS Policies for Unified Proxy Model
-- =============================================
-- 
-- This migration adds Row-Level Security policies to ensure:
-- 1. Proxy users are ONLY visible to their manager
-- 2. SuperAdmins can see all users
-- 3. League members can see other REAL members (not proxies)
-- 4. Users can CRUD their own proxies
-- 5. Submissions respect proxy ownership

-- ===========================================
-- USERS TABLE RLS
-- ===========================================

-- Enable RLS on users (idempotent)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (clean slate for proxy model)
DROP POLICY IF EXISTS "users_select_self" ON users;
DROP POLICY IF EXISTS "users_select_managed_proxies" ON users;
DROP POLICY IF EXISTS "users_select_superadmin" ON users;
DROP POLICY IF EXISTS "users_select_league_members" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_update_managed_proxies" ON users;
DROP POLICY IF EXISTS "users_insert_proxy" ON users;
DROP POLICY IF EXISTS "users_delete_managed_proxies" ON users;

-- Policy 1: Users can see themselves
CREATE POLICY "users_select_self" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can see their managed proxies (not archived, not deleted)
CREATE POLICY "users_select_managed_proxies" ON users
    FOR SELECT
    USING (
        managed_by = auth.uid()
        AND deleted_at IS NULL
    );

-- Policy 3: SuperAdmins can see all users (including all proxies)
CREATE POLICY "users_select_superadmin" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.is_superadmin = true
        )
    );

-- Policy 4: League members can see other REAL members (NOT proxies)
-- This allows users to see fellow league members in leaderboards
CREATE POLICY "users_select_league_members" ON users
    FOR SELECT
    USING (
        -- Only real users (not proxies)
        is_proxy = false
        AND deleted_at IS NULL
        -- Must share at least one league
        AND EXISTS (
            SELECT 1 FROM memberships m1
            JOIN memberships m2 ON m1.league_id = m2.league_id
            WHERE m1.user_id = auth.uid()
            AND m2.user_id = users.id
        )
    );

-- Policy 5: Users can update their own record
CREATE POLICY "users_update_self" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 6: Users can update their managed proxies
CREATE POLICY "users_update_managed_proxies" ON users
    FOR UPDATE
    USING (managed_by = auth.uid())
    WITH CHECK (managed_by = auth.uid());

-- Policy 7: Users can create proxy users (managed_by = themselves)
-- The is_proxy flag is auto-set by trigger
CREATE POLICY "users_insert_proxy" ON users
    FOR INSERT
    WITH CHECK (
        managed_by = auth.uid() 
        AND managed_by IS NOT NULL
    );

-- Policy 8: Users can soft-delete their managed proxies
CREATE POLICY "users_delete_managed_proxies" ON users
    FOR DELETE
    USING (managed_by = auth.uid());

-- ===========================================
-- SUBMISSIONS TABLE RLS (Updated for "Act As")
-- ===========================================

-- Drop existing submission policies to update for proxy model
DROP POLICY IF EXISTS "submissions_select_own_and_proxies" ON submissions;
DROP POLICY IF EXISTS "submissions_insert_own_and_proxies" ON submissions;
DROP POLICY IF EXISTS "submissions_update_own_and_proxies" ON submissions;
DROP POLICY IF EXISTS "submissions_delete_own_and_proxies" ON submissions;

-- Policy: Users can see their own submissions + their proxies' submissions
CREATE POLICY "submissions_select_own_and_proxies" ON submissions
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = submissions.user_id 
            AND u.managed_by = auth.uid()
            AND u.deleted_at IS NULL
        )
    );

-- Policy: Users can insert submissions for themselves OR their proxies
CREATE POLICY "submissions_insert_own_and_proxies" ON submissions
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_id 
            AND u.managed_by = auth.uid()
            AND u.deleted_at IS NULL
        )
    );

-- Policy: Users can update submissions for themselves OR their proxies
CREATE POLICY "submissions_update_own_and_proxies" ON submissions
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = submissions.user_id 
            AND u.managed_by = auth.uid()
            AND u.deleted_at IS NULL
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_id 
            AND u.managed_by = auth.uid()
            AND u.deleted_at IS NULL
        )
    );

-- Policy: Users can delete submissions for themselves OR their proxies
CREATE POLICY "submissions_delete_own_and_proxies" ON submissions
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = submissions.user_id 
            AND u.managed_by = auth.uid()
            AND u.deleted_at IS NULL
        )
    );

-- ===========================================
-- MEMBERSHIPS TABLE RLS (for proxy league membership)
-- ===========================================

-- Allow managers to add their proxies to leagues they belong to
DROP POLICY IF EXISTS "memberships_insert_proxy" ON memberships;
CREATE POLICY "memberships_insert_proxy" ON memberships
    FOR INSERT
    WITH CHECK (
        -- User is adding their own proxy
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_id 
            AND u.managed_by = auth.uid()
        )
        -- And user is already a member of that league
        AND EXISTS (
            SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.league_id = league_id
        )
    );

-- ===========================================
-- Performance indexes for RLS efficiency
-- ===========================================

-- Index for proxy lookup (already created in schema migration, but ensure exists)
CREATE INDEX IF NOT EXISTS idx_users_managed_by_active 
    ON users(managed_by) 
    WHERE managed_by IS NOT NULL AND deleted_at IS NULL;

-- Composite index for league member lookup
CREATE INDEX IF NOT EXISTS idx_memberships_user_league 
    ON memberships(user_id, league_id);

-- ===========================================
-- Documentation
-- ===========================================

COMMENT ON POLICY "users_select_self" ON users IS 
    'PRD 41: Users can always see their own profile';

COMMENT ON POLICY "users_select_managed_proxies" ON users IS 
    'PRD 41: Managers can see their proxy users (not deleted)';

COMMENT ON POLICY "users_select_superadmin" ON users IS 
    'PRD 41: SuperAdmins have full visibility of all users';

COMMENT ON POLICY "users_select_league_members" ON users IS 
    'PRD 41: League members can see real (non-proxy) members in shared leagues';

COMMENT ON POLICY "users_insert_proxy" ON users IS 
    'PRD 41: Any authenticated user can create proxies they manage';

COMMENT ON POLICY "submissions_select_own_and_proxies" ON submissions IS 
    'PRD 41: Users see their own + their proxies submissions';

-- ===========================================
-- PHASE F: Robustness Triggers
-- ===========================================

-- F.1: Cascade soft-delete to orphan proxies when manager is deleted
-- When a manager is soft-deleted, also soft-delete their unclaimed proxies
CREATE OR REPLACE FUNCTION cascade_manager_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if this user is being soft-deleted (deleted_at changed from NULL to NOT NULL)
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        -- Soft delete all unclaimed proxies managed by this user
        UPDATE users
        SET deleted_at = NEW.deleted_at
        WHERE managed_by = NEW.id
          AND deleted_at IS NULL;
          
        -- Log the cascade in audit_log
        INSERT INTO audit_log (action, actor_id, target_id, details)
        SELECT 
            'proxy_cascade_deleted',
            NEW.id,
            id,
            jsonb_build_object(
                'reason', 'manager_soft_deleted',
                'manager_id', NEW.id
            )
        FROM users
        WHERE managed_by = NEW.id
          AND deleted_at = NEW.deleted_at;  -- Recently deleted in this cascade
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cascade_manager_soft_delete ON users;
CREATE TRIGGER trg_cascade_manager_soft_delete
    AFTER UPDATE OF deleted_at ON users
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION cascade_manager_soft_delete();

COMMENT ON FUNCTION cascade_manager_soft_delete() IS 
    'PRD 41 Phase F: When manager is soft-deleted, cascade to their proxies';

-- F.2: Helper function for activity decay job
-- This function marks stale proxies as archived (can be called by cron/edge function)
CREATE OR REPLACE FUNCTION archive_inactive_proxies(decay_days INTEGER DEFAULT 180)
RETURNS TABLE(archived_count INTEGER, archived_ids UUID[]) AS $$
DECLARE
    cutoff_date TIMESTAMPTZ;
    result_ids UUID[];
    result_count INTEGER;
BEGIN
    cutoff_date := NOW() - (decay_days || ' days')::INTERVAL;
    
    -- Find and archive proxies with no recent submissions
    WITH stale_proxies AS (
        SELECT u.id
        FROM users u
        WHERE u.is_proxy = true
          AND u.is_archived = false
          AND u.deleted_at IS NULL
          AND u.managed_by IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM submissions s
              WHERE s.user_id = u.id
                AND s.created_at > cutoff_date
          )
    ),
    archived AS (
        UPDATE users
        SET is_archived = true
        FROM stale_proxies
        WHERE users.id = stale_proxies.id
        RETURNING users.id
    )
    SELECT ARRAY_AGG(id), COUNT(*)::INTEGER INTO result_ids, result_count FROM archived;
    
    archived_count := COALESCE(result_count, 0);
    archived_ids := COALESCE(result_ids, ARRAY[]::UUID[]);
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_inactive_proxies(INTEGER) IS 
    'PRD 41 Phase F: Archives proxies with no submissions in decay_days (default 180). Call from cron job.';
