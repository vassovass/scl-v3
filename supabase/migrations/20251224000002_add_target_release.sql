-- Add target release/milestone field for roadmap prioritization
-- Migration: 20251224000002_add_target_release.sql
-- Best practice: "Now-Next-Later" framework is industry standard

-- Add target release column to feedback table
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS target_release VARCHAR(20) DEFAULT 'later'
CHECK (target_release IN ('now', 'next', 'later', 'future'));

-- Add index for filtering by target release
CREATE INDEX IF NOT EXISTS idx_feedback_target_release ON feedback(target_release);

-- Comment
COMMENT ON COLUMN feedback.target_release IS 'Roadmap timeframe: now (this sprint), next (next 1-2 releases), later (3-6 months), future (someday)';

-- Update some example mappings (adjust based on board_status):
-- in_progress -> now
-- todo -> next  
-- backlog -> later
