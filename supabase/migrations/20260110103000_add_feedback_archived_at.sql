-- Add soft-delete support to feedback table
-- Migration: 20260110103000_add_feedback_archived_at.sql

-- Add archived_at column for soft-delete functionality
-- NULL = active item, timestamp = archived/soft-deleted
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for efficient filtering of non-archived items
CREATE INDEX IF NOT EXISTS idx_feedback_archived_at 
ON feedback(archived_at) WHERE archived_at IS NULL;

-- Comment for documentation
COMMENT ON COLUMN feedback.archived_at IS 'Soft-delete timestamp. NULL = active, timestamp = archived. Hard delete removes row entirely.';
