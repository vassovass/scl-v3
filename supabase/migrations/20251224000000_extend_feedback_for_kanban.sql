-- Extend feedback table for Kanban board functionality
-- Migration: 20251224000000_extend_feedback_for_kanban.sql

-- Add Kanban board status column
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS board_status VARCHAR(20) DEFAULT 'backlog' 
CHECK (board_status IN ('backlog', 'todo', 'in_progress', 'review', 'done'));

-- Add visibility flag for public roadmap
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Add priority order for admin sorting
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS priority_order INTEGER DEFAULT 0;

-- Add completion date for changelog
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add user_id reference if not exists (for tracking who submitted)
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add page_url for context
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS page_url TEXT;

-- Update type constraint to include more options
ALTER TABLE feedback 
DROP CONSTRAINT IF EXISTS feedback_type_check;

ALTER TABLE feedback 
ADD CONSTRAINT feedback_type_check 
CHECK (type IN ('bug', 'feature', 'improvement', 'general', 'positive', 'negative'));

-- Index for board status filtering
CREATE INDEX IF NOT EXISTS idx_feedback_board_status ON feedback(board_status);

-- Index for public roadmap items
CREATE INDEX IF NOT EXISTS idx_feedback_is_public ON feedback(is_public) WHERE is_public = TRUE;

-- Comment
COMMENT ON COLUMN feedback.board_status IS 'Kanban board column: backlog, todo, in_progress, review, done';
COMMENT ON COLUMN feedback.is_public IS 'Whether this item appears on the public roadmap';
COMMENT ON COLUMN feedback.priority_order IS 'Admin-controlled sort order within board columns';
COMMENT ON COLUMN feedback.completed_at IS 'When the item was marked as done (for changelog)';
