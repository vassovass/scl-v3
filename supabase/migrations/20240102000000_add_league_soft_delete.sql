-- Add soft delete support for leagues
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- Index for efficient querying of non-deleted leagues
CREATE INDEX IF NOT EXISTS idx_leagues_deleted_at ON leagues(deleted_at) WHERE deleted_at IS NULL;

-- Comment for clarity
COMMENT ON COLUMN leagues.deleted_at IS 'Soft delete timestamp. NULL means active, non-NULL means in trash (7-day retention)';
COMMENT ON COLUMN leagues.deleted_by IS 'User who deleted the league';
