-- Add agent work tracking columns to feedback table
-- Migration: 20251224100000_add_agent_work_tracking.sql
-- Purpose: Track what the AI agent is currently working on for roadmap display

-- Add columns for agent work tracking
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS is_agent_working BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agent_work_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS agent_work_subject TEXT,
ADD COLUMN IF NOT EXISTS completion_status TEXT DEFAULT 'backlog';

-- Index for fast lookup of active agent work
CREATE INDEX IF NOT EXISTS idx_feedback_agent_working 
ON feedback(is_agent_working) WHERE is_agent_working = TRUE;

-- Comments
COMMENT ON COLUMN feedback.is_agent_working IS 'True if AI agent is actively working on this item';
COMMENT ON COLUMN feedback.agent_work_started_at IS 'When the agent started working on this item';
COMMENT ON COLUMN feedback.agent_work_subject IS 'Subject for new agent-created work items';
COMMENT ON COLUMN feedback.completion_status IS 'Status: backlog, in_progress, pending_review, verified, done';
