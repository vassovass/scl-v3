-- Migration: Allow managers to control proxy submissions
-- Description: Updates RLS on submissions table to allow users to INSERT/UPDATE/DELETE submissions for users they manage.

-- Policy: Users can insert submissions for themselves OR users they manage
DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;

CREATE POLICY "Users can manage own or proxy submissions"
ON submissions
FOR ALL -- Covers SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = submissions.user_id 
    AND users.managed_by = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = submissions.user_id 
    AND users.managed_by = auth.uid()
  )
);

-- Note: We replace the specific 'insert' policy with a comprehensive ALL policy or supplementary policies.
-- Let's check existing policies first to be safe, but typically we want to broaden the scope.
-- If there are other specific policies (e.g. for reading league submissions), we need to ensure we don't conflict.
-- Usually, policies are OR'd. So adding this new policy enables the access.

-- However, to avoid "infinite recursion" or performance issues, we keep it simple.
-- Ideally we would have specific policies for operations.

-- Let's add specific policies to be cleaner and not mess with existing "View" policies that might be broader (anyone in league).

CREATE POLICY "Managers can insert proxy submissions"
ON submissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = submissions.user_id 
    AND users.managed_by = auth.uid()
  )
);

CREATE POLICY "Managers can update proxy submissions"
ON submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = submissions.user_id 
    AND users.managed_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = submissions.user_id 
    AND users.managed_by = auth.uid()
  )
);

CREATE POLICY "Managers can delete proxy submissions"
ON submissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = submissions.user_id 
    AND users.managed_by = auth.uid()
  )
);

-- Note: SELECT is usually covered by "Users can view submissions in their leagues" or similar.
-- But managers definitely need to see their proxy's submissions even if not in a league?
-- Maybe, but usually proxies are in a league.
-- We'll add a view policy just in case.

CREATE POLICY "Managers can view proxy submissions"
ON submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = submissions.user_id 
    AND users.managed_by = auth.uid()
  )
);
