-- Migration: Add DEFAULT clause to invite_code
-- Ensures new proxy members automatically get an invite code without API changes

ALTER TABLE proxy_members 
ALTER COLUMN invite_code SET DEFAULT SUBSTRING(gen_random_uuid()::text, 1, 8);
