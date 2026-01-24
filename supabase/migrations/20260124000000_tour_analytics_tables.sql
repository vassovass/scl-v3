-- ============================================
-- Tour Analytics Tables
-- PRD 50: Modular Tour System v2.0
-- 
-- Creates tables for tracking tour completions,
-- step interactions, and user feedback.
-- ============================================

-- ─────────────────────────────────────────────
-- Tour Completions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id TEXT NOT NULL,
    tour_version TEXT NOT NULL,
    completion_type TEXT NOT NULL CHECK (completion_type IN ('completed', 'skipped')),
    steps_completed INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER NOT NULL,
    duration_ms INTEGER,
    experiment_variant TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Composite index for user-tour lookups
    CONSTRAINT unique_user_tour_completion UNIQUE (user_id, tour_id, completed_at)
);

-- Indexes for query performance
CREATE INDEX idx_tour_completions_user_id ON tour_completions(user_id);
CREATE INDEX idx_tour_completions_tour_id ON tour_completions(tour_id);
CREATE INDEX idx_tour_completions_completed_at ON tour_completions(completed_at);
CREATE INDEX idx_tour_completions_experiment ON tour_completions(experiment_variant) 
    WHERE experiment_variant IS NOT NULL;

-- ─────────────────────────────────────────────
-- Tour Step Interactions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_step_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('viewed', 'completed', 'skipped')),
    duration_ms INTEGER,
    validation_result TEXT CHECK (validation_result IN ('success', 'timeout', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX idx_tour_step_interactions_user_id ON tour_step_interactions(user_id);
CREATE INDEX idx_tour_step_interactions_tour_step ON tour_step_interactions(tour_id, step_id);
CREATE INDEX idx_tour_step_interactions_created_at ON tour_step_interactions(created_at);

-- ─────────────────────────────────────────────
-- Tour Feedback
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX idx_tour_feedback_user_id ON tour_feedback(user_id);
CREATE INDEX idx_tour_feedback_tour_id ON tour_feedback(tour_id);
CREATE INDEX idx_tour_feedback_submitted_at ON tour_feedback(submitted_at);

-- ─────────────────────────────────────────────
-- Row Level Security (RLS)
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE tour_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_step_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_feedback ENABLE ROW LEVEL SECURITY;

-- Tour Completions: Users can insert their own, admins can read all
CREATE POLICY "Users can insert own tour completions" ON tour_completions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tour completions" ON tour_completions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tour completions" ON tour_completions
    FOR SELECT
    USING (is_superadmin() = true);

-- Tour Step Interactions: Same pattern
CREATE POLICY "Users can insert own step interactions" ON tour_step_interactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own step interactions" ON tour_step_interactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all step interactions" ON tour_step_interactions
    FOR SELECT
    USING (is_superadmin() = true);

-- Tour Feedback: Same pattern
CREATE POLICY "Users can insert own feedback" ON tour_feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON tour_feedback
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON tour_feedback
    FOR SELECT
    USING (is_superadmin() = true);

-- ─────────────────────────────────────────────
-- Comments for documentation
-- ─────────────────────────────────────────────
COMMENT ON TABLE tour_completions IS 'Tracks when users complete or skip guided tours';
COMMENT ON TABLE tour_step_interactions IS 'Tracks individual step interactions within tours';
COMMENT ON TABLE tour_feedback IS 'Stores user feedback on tour experience';

COMMENT ON COLUMN tour_completions.experiment_variant IS 'A/B test variant if the tour has experiments';
COMMENT ON COLUMN tour_step_interactions.validation_result IS 'Result of interactive step validation';
