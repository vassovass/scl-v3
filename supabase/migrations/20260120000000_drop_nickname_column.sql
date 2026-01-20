-- PRD 43: Unified User Identity
-- Remove the nickname column - all identity now goes through display_name
-- The 1 user with nickname set already has display_name populated, so no data migration needed

-- Drop the nickname column
ALTER TABLE public.users DROP COLUMN IF EXISTS nickname;

-- Add comment to display_name explaining its purpose
COMMENT ON COLUMN public.users.display_name IS 'User public identity shown on leaderboards and visible to all users';
