-- Drop legacy duplicate policies on users table
-- These are superseded by the snake_case named policies (e.g., users_select_managed_proxies)

DROP POLICY IF EXISTS "Users can view their proxies" ON users;
DROP POLICY IF EXISTS "Users can create proxy members" ON users;
DROP POLICY IF EXISTS "Users can delete their proxies" ON users;
DROP POLICY IF EXISTS "Users can update their proxies" ON users;
