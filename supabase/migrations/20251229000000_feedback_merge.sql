-- Add merged_into_id column to feedback table to track when items are merged
-- Migration: 20251229000000_feedback_merge.sql

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES feedback(id);

-- Index for finding merged items quickly (e.g. for undo or history)
CREATE INDEX IF NOT EXISTS idx_feedback_merged_into 
ON feedback(merged_into_id) WHERE merged_into_id IS NOT NULL;

COMMENT ON COLUMN feedback.merged_into_id IS 'If set, this item was merged into the referenced item ID and should be considered archived';
