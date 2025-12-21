-- Add nickname field to users table (not profiles)
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN users.nickname IS 'Optional custom display name shown in leagues';
