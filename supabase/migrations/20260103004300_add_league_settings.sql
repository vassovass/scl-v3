-- Add new settings columns to leagues table
ALTER TABLE leagues 
ADD COLUMN IF NOT EXISTS counting_start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT requesting_user_id() IS NOT NULL, -- Defaults to false effectively, but using false explicitly below
ADD COLUMN IF NOT EXISTS allow_manual_entry BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS require_verification_photo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS daily_step_goal INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Set defaults for existing rows (optional, but good practice if not using DEFAULT in ADD COLUMN widely)
ALTER TABLE leagues ALTER COLUMN is_public SET DEFAULT FALSE;
ALTER TABLE leagues ALTER COLUMN allow_manual_entry SET DEFAULT TRUE;
ALTER TABLE leagues ALTER COLUMN require_verification_photo SET DEFAULT FALSE;
ALTER TABLE leagues ALTER COLUMN daily_step_goal SET DEFAULT 10000;
ALTER TABLE leagues ALTER COLUMN max_members SET DEFAULT 50;
ALTER TABLE leagues ALTER COLUMN category SET DEFAULT 'general';

-- Comments
COMMENT ON COLUMN leagues.counting_start_date IS 'If set, only submissions with for_date >= counting_start_date count toward this league.';
COMMENT ON COLUMN leagues.description IS 'Short bio or motto for the league.';
COMMENT ON COLUMN leagues.is_public IS 'Whether the league appears in public directories.';
COMMENT ON COLUMN leagues.allow_manual_entry IS 'If false, users cannot manually type steps; must use batch/verified upload.';
COMMENT ON COLUMN leagues.require_verification_photo IS 'If true, all submissions must have a proof photo.';
COMMENT ON COLUMN leagues.daily_step_goal IS 'Visual target for members (does not limit inputs).';
COMMENT ON COLUMN leagues.max_members IS 'Maximum number of members allowed.';
COMMENT ON COLUMN leagues.category IS 'Category tag (e.g., corporate, friends, running).';
