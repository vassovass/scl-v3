-- PRD 34: B2B Landing Pages — Waitlist Table
-- Captures corporate wellness interest from /teams landing page

CREATE TABLE IF NOT EXISTS b2b_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  company_name TEXT,
  company_size TEXT, -- '1-50', '51-200', '201-500', '500+'
  role TEXT, -- 'HR', 'Wellness', 'Team Lead', 'Other'
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- RLS: Public insert (waitlist form), superadmin-only read/update
ALTER TABLE b2b_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON b2b_waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Superadmins can read waitlist"
  ON b2b_waitlist FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY "Superadmins can update waitlist"
  ON b2b_waitlist FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true)
  );

-- Index for admin queries
CREATE INDEX idx_b2b_waitlist_created_at ON b2b_waitlist (created_at DESC);
CREATE INDEX idx_b2b_waitlist_email ON b2b_waitlist (email);
