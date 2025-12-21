-- Create module_feedback table for inline UI feedback
CREATE TABLE IF NOT EXISTS module_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id VARCHAR(100) NOT NULL,
  module_name VARCHAR(255),
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  comment TEXT,
  screenshot_url TEXT,
  page_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for filtering and analysis
CREATE INDEX IF NOT EXISTS idx_module_feedback_module_id ON module_feedback(module_id);
CREATE INDEX IF NOT EXISTS idx_module_feedback_type ON module_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_module_feedback_created_at ON module_feedback(created_at DESC);

-- Comment
COMMENT ON TABLE module_feedback IS 'Inline module/section feedback with thumbs up/down and optional screenshots';
