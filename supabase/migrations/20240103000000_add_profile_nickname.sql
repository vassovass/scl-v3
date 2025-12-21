-- Add nickname field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN profiles.nickname IS 'Optional custom display name shown in leagues';
