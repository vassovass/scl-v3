-- Fix user relationship for PostgREST
-- Migration: 20251224000003_fix_feedback_user_fk.sql

-- 1. Drop the existing foreign key to auth.users (if it exists)
-- We need to know the name, usually feedback_user_id_fkey
ALTER TABLE feedback 
DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

-- 2. Add new foreign key to public.users
-- This allows PostgREST to detect the relationship for select('*, users(*)')
ALTER TABLE feedback
ADD CONSTRAINT feedback_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id)
ON DELETE SET NULL;

-- 3. Explicitly comment for documentation
COMMENT ON CONSTRAINT feedback_user_id_fkey ON feedback IS 'Points to public.users to allow API expansion';
