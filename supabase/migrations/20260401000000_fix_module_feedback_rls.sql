-- Fix: Enable RLS on module_feedback (critical security vulnerability)
-- Table was created without RLS policies

ALTER TABLE module_feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON module_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback"
  ON module_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Superadmins can read all feedback (for analytics/review)
CREATE POLICY "Superadmins can read all feedback"
  ON module_feedback FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  );

-- No UPDATE or DELETE policies — feedback is immutable once submitted
