-- Migration: Refactor proxy users into users table
-- Description: Drops proxy_members table and adds support for proxy users in the main users table.

-- 1. Clean up old proxy tables and columns
DROP TABLE IF EXISTS proxy_members CASCADE;

ALTER TABLE submissions 
DROP COLUMN IF EXISTS proxy_member_id;

-- 2. Update users table to support proxy users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_proxy BOOLEAN DEFAULT FALSE;

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by);
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);

-- 4. RLS Policies for Proxy Management
-- Allow users to create new users (proxies) where they are the manager
CREATE POLICY "Users can create proxy members" 
ON users 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = managed_by
);

-- Allow users to update proxies they manage
CREATE POLICY "Users can update their proxies" 
ON users 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = managed_by
)
WITH CHECK (
  auth.uid() = managed_by
);

-- Allow users to delete proxies they manage
CREATE POLICY "Users can delete their proxies" 
ON users 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() = managed_by
);

-- Allow users to see their own proxies
CREATE POLICY "Users can view their proxies" 
ON users 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() = managed_by OR id = auth.uid() OR is_superadmin = true
);

-- Update public/league visibility policies if needed (users are generally public in this app?)
-- Existing policies usually allow viewing all users or users in same league. 
-- We ensure managed_by users are also visible to their managers (added above).

COMMENT ON COLUMN users.managed_by IS 'The user ID who manages this proxy account';
COMMENT ON COLUMN users.invite_code IS 'Code used to claim this proxy account';
COMMENT ON COLUMN users.is_proxy IS 'Flag indicating this is a proxy/ghost account not yet claimed';
