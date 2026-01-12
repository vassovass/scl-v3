-- Migration: Add submission_changes table for audit logging
-- Created: 2026-01-13

-- Create submission_changes table to track all edits
CREATE TABLE IF NOT EXISTS public.submission_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    field_name TEXT NOT NULL,  -- 'for_date', 'proof_path', 'steps', 'deleted'
    old_value TEXT,
    new_value TEXT,
    reason TEXT,               -- User-provided comment
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching history by submission
CREATE INDEX IF NOT EXISTS idx_submission_changes_submission 
    ON public.submission_changes(submission_id);

-- Index for admin queries by user
CREATE INDEX IF NOT EXISTS idx_submission_changes_user 
    ON public.submission_changes(user_id, created_at DESC);

-- RLS policies
ALTER TABLE public.submission_changes ENABLE ROW LEVEL SECURITY;

-- Users can view their own change history
CREATE POLICY submission_changes_select_own ON public.submission_changes
    FOR SELECT USING (auth.uid() = user_id);

-- Superadmins can view all
CREATE POLICY submission_changes_select_admin ON public.submission_changes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
    );

-- Insert is done via admin client in API, no direct insert policy needed
