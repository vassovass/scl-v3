-- Add feature completion lifecycle tracking
-- Migration: 20251224110000_add_completion_status.sql
-- States: backlog → in_progress → pending_review → done (or needs_work)

-- Add completion status column
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS 
  completion_status VARCHAR(20) DEFAULT 'backlog'
  CHECK (completion_status IN ('backlog', 'in_progress', 'pending_review', 'verified', 'done', 'needs_work'));

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_feedback_completion_status 
ON feedback(completion_status);

-- Comments
COMMENT ON COLUMN feedback.completion_status IS 'Feature lifecycle: backlog, in_progress, pending_review, verified, done, needs_work';
