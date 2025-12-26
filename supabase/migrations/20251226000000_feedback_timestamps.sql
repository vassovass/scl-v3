-- PRD 1: Add timestamp tracking columns to feedback table
-- Migration: 20251226000000_feedback_timestamps.sql

-- 1. Add status_changed_at to track when board_status changes
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

-- 2. Ensure updated_at column exists (should already exist from initial migration)
-- This is a no-op if it already exists
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create trigger function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_feedback_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Always update updated_at
    NEW.updated_at = NOW();
    
    -- Update status_changed_at when board_status changes
    IF OLD.board_status IS DISTINCT FROM NEW.board_status THEN
        NEW.status_changed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on feedback table
DROP TRIGGER IF EXISTS feedback_timestamp_trigger ON feedback;
CREATE TRIGGER feedback_timestamp_trigger
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_timestamps();

-- 5. Initialize status_changed_at for existing records (use updated_at or created_at)
UPDATE feedback 
SET status_changed_at = COALESCE(updated_at, created_at)
WHERE status_changed_at IS NULL;

-- 6. Create composite indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_feedback_status_type ON feedback(board_status, type);
CREATE INDEX IF NOT EXISTS idx_feedback_status_changed ON feedback(status_changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_updated_at ON feedback(updated_at DESC);

-- 7. Comments for documentation
COMMENT ON COLUMN feedback.status_changed_at IS 'Automatically updated when board_status changes';
COMMENT ON COLUMN feedback.updated_at IS 'Automatically updated on any record modification';
COMMENT ON FUNCTION update_feedback_timestamps() IS 'Trigger function to auto-update feedback timestamps';
