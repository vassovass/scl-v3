-- Create roadmap voting and comments tables
-- Migration: 20251224000001_create_roadmap_tables.sql

-- Roadmap votes table (1-10 priority rating)
CREATE TABLE IF NOT EXISTS roadmap_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (feedback_id, user_id)
);

-- Roadmap comments table
CREATE TABLE IF NOT EXISTS roadmap_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_feedback_id ON roadmap_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_user_id ON roadmap_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_comments_feedback_id ON roadmap_comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_comments_created_at ON roadmap_comments(created_at DESC);

-- RLS Policies for roadmap_votes
ALTER TABLE roadmap_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read votes (for displaying averages)
CREATE POLICY "Anyone can view votes" ON roadmap_votes
  FOR SELECT USING (true);

-- Authenticated users can insert their own votes
CREATE POLICY "Users can insert own votes" ON roadmap_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes" ON roadmap_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes" ON roadmap_votes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for roadmap_comments
ALTER TABLE roadmap_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Anyone can view comments" ON roadmap_comments
  FOR SELECT USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Users can insert comments" ON roadmap_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON roadmap_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON roadmap_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE roadmap_votes IS 'User priority votes (1-10) for public roadmap items';
COMMENT ON TABLE roadmap_comments IS 'User comments on public roadmap items';
