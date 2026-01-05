-- PRD 20: Generic Attachments Table
-- Supports attachments for any entity type (feedback, submissions, leagues, etc.)

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,         -- 'feedback', 'submission', 'league', 'user'
  entity_id UUID NOT NULL,           -- ID of the parent entity
  file_url TEXT NOT NULL,            -- Public URL to the file
  file_name TEXT NOT NULL,           -- Original filename
  file_type TEXT NOT NULL,           -- MIME type: 'image/png', 'image/jpeg', etc.
  file_size INTEGER,                 -- Size in bytes
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE attachments IS 'Generic attachments table for any entity type';
COMMENT ON COLUMN attachments.entity_type IS 'Type of parent entity: feedback, submission, league, user';
COMMENT ON COLUMN attachments.entity_id IS 'UUID of the parent entity';

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_attachments_entity 
  ON attachments(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_attachments_created_at 
  ON attachments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by 
  ON attachments(uploaded_by);

-- Enable RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Superadmins can do everything
CREATE POLICY "Superadmins have full access to attachments"
  ON attachments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_superadmin = true
    )
  );

-- Anyone can read attachments for public feedback (on roadmap)
CREATE POLICY "Public can read attachments for public feedback"
  ON attachments
  FOR SELECT
  USING (
    entity_type = 'feedback' AND
    EXISTS (
      SELECT 1 FROM feedback 
      WHERE feedback.id = attachments.entity_id 
      AND feedback.is_public = true
    )
  );

-- Authenticated users can read attachments for their own entities
CREATE POLICY "Users can read own attachments"
  ON attachments
  FOR SELECT
  USING (
    uploaded_by = auth.uid()
  );

-- Authenticated users can insert attachments
CREATE POLICY "Authenticated users can insert attachments"
  ON attachments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    uploaded_by = auth.uid()
  );

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
  ON attachments
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
  );
