-- Migration: Add invite_code to proxy_members for claim links
-- This allows proxy members to be claimed by real users via a unique invite link

-- Add invite_code column with DEFAULT (auto-generates for new records)
ALTER TABLE proxy_members 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE DEFAULT SUBSTRING(gen_random_uuid()::text, 1, 8);

-- Generate invite codes for existing proxy members (in case any were created before this migration)
UPDATE proxy_members 
SET invite_code = SUBSTRING(gen_random_uuid()::text, 1, 8)
WHERE invite_code IS NULL;

-- Make invite_code required for new records
ALTER TABLE proxy_members 
ALTER COLUMN invite_code SET NOT NULL;

-- Add index for fast lookups by invite_code
CREATE INDEX IF NOT EXISTS idx_proxy_members_invite_code 
ON proxy_members(invite_code);

-- Comment for documentation
COMMENT ON COLUMN proxy_members.invite_code IS 'Unique code for proxy claim links (e.g., /claim/abc123)';
