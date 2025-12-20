-- Add backfill_limit to leagues
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS backfill_limit INTEGER;

-- Add flagged status to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS flag_reason TEXT;
