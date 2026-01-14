-- HOTFIX: Fix infinite recursion in memberships table RLS policies
-- ================================================================
-- 
-- Problem: Multiple policies on memberships reference the memberships table,
-- triggering RLS checks recursively (error 42P17).
--
-- Solution: Create SECURITY DEFINER functions that bypass RLS for internal checks.

-- Step 1: Create helper function to check if user is member of a league
-- This bypasses RLS by running as postgres user
CREATE OR REPLACE FUNCTION is_league_member(check_user_id UUID, check_league_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM memberships 
        WHERE user_id = check_user_id 
        AND league_id = check_league_id
    );
$$;

-- Step 2: Create helper function to check if user has admin/owner role in a league
CREATE OR REPLACE FUNCTION is_league_admin(check_user_id UUID, check_league_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM memberships 
        WHERE user_id = check_user_id 
        AND league_id = check_league_id
        AND role IN ('owner', 'admin')
    );
$$;

-- Step 3: Create helper function to check if two users share any league
CREATE OR REPLACE FUNCTION shares_league_with(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM memberships m1
        JOIN memberships m2 ON m1.league_id = m2.league_id
        WHERE m1.user_id = user_a 
        AND m2.user_id = user_b
    );
$$;

COMMENT ON FUNCTION is_league_member(UUID, UUID) IS 
    'Hotfix: Check league membership without triggering RLS recursion.';
COMMENT ON FUNCTION is_league_admin(UUID, UUID) IS 
    'Hotfix: Check if user is admin/owner in a league without RLS recursion.';
COMMENT ON FUNCTION shares_league_with(UUID, UUID) IS 
    'Hotfix: Check if two users share any league without RLS recursion.';

-- Step 4: Fix memberships_select_self_or_league policy
DROP POLICY IF EXISTS "memberships_select_self_or_league" ON memberships;
CREATE POLICY "memberships_select_self_or_league" ON memberships
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR is_league_member(auth.uid(), league_id)
    );

-- Step 5: Fix memberships_owner_manage_roles policy
DROP POLICY IF EXISTS "memberships_owner_manage_roles" ON memberships;
CREATE POLICY "memberships_owner_manage_roles" ON memberships
    FOR UPDATE
    USING (is_league_admin(auth.uid(), league_id))
    WITH CHECK (is_league_admin(auth.uid(), league_id));

-- Step 6: Fix memberships_insert_proxy policy
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
        -- And user is already a member of that league (using safe function)
        AND is_league_member(auth.uid(), league_id)
    );

-- Step 7: Fix users_select_league_members policy using the shares_league_with function
DROP POLICY IF EXISTS "users_select_league_members" ON users;
CREATE POLICY "users_select_league_members" ON users
    FOR SELECT
    USING (
        -- Only real users (not proxies)
        is_proxy = false
        AND deleted_at IS NULL
        -- Must share at least one league (using SECURITY DEFINER function)
        AND shares_league_with(auth.uid(), id)
    );

COMMENT ON POLICY "memberships_select_self_or_league" ON memberships IS 
    'Hotfix: Users can see own memberships + memberships in shared leagues (using safe function)';
COMMENT ON POLICY "memberships_owner_manage_roles" ON memberships IS 
    'Hotfix: Admins/owners can manage roles in their leagues (using safe function)';
COMMENT ON POLICY "memberships_insert_proxy" ON memberships IS 
    'Hotfix: Users can add proxies to leagues they belong to (using safe function)';
COMMENT ON POLICY "users_select_league_members" ON users IS 
    'Hotfix: Users can see real members in shared leagues (using safe function)';
