-- HOTFIX: Fix infinite recursion in users table RLS policy
-- ========================================================
-- 
-- Problem: The "users_select_superadmin" policy queries the users table
-- to check if the current user is a superadmin, which triggers the same
-- RLS policy check and causes infinite recursion (error 42P17).
--
-- Solution: Create a security definer function that bypasses RLS to
-- check superadmin status, then use that function in the policy.

-- Step 1: Create a SECURITY DEFINER function to check superadmin status
-- This function runs with the privileges of the function owner (postgres),
-- bypassing RLS checks and avoiding the recursion.
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE(
        (SELECT is_superadmin FROM users WHERE id = auth.uid()),
        false
    );
$$;

COMMENT ON FUNCTION is_superadmin() IS 
    'PRD 41 Hotfix: Check if current user is superadmin. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';

-- Step 2: Drop the problematic policy
DROP POLICY IF EXISTS "users_select_superadmin" ON users;

-- Step 3: Recreate the policy using the safe function
CREATE POLICY "users_select_superadmin" ON users
    FOR SELECT
    USING (is_superadmin() = true);

COMMENT ON POLICY "users_select_superadmin" ON users IS 
    'PRD 41: SuperAdmins have full visibility of all users. Uses is_superadmin() function to avoid RLS recursion.';

-- Verification: This policy now works because:
-- 1. is_superadmin() is SECURITY DEFINER, so it runs as postgres user
-- 2. As postgres, RLS doesn't apply, so no recursion
-- 3. The function is STABLE so it can be cached per-statement

