-- Migration: Create proxy_members table for placeholder profiles
-- Proxy members allow admins to submit steps on behalf of users who haven't signed up yet

CREATE TABLE proxy_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast league lookups
CREATE INDEX idx_proxy_members_league ON proxy_members(league_id);

-- Add proxy_member_id to submissions for tracking proxy submissions
ALTER TABLE submissions ADD COLUMN proxy_member_id UUID REFERENCES proxy_members(id) ON DELETE SET NULL;
