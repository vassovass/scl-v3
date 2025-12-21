-- Create user_records table
CREATE TABLE IF NOT EXISTS user_records (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    best_day_steps INTEGER DEFAULT 0,
    best_day_date DATE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_steps_lifetime BIGINT DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_records ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own records"
    ON user_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own records" -- Mostly updated by trigger, but possibly useful
    ON user_records FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to recalculate records for a user
CREATE OR REPLACE FUNCTION recalculate_user_records(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    r RECORD;
    curr_streak INTEGER := 0;
    max_streak INTEGER := 0;
    prev_date DATE := NULL;
    
    total_steps BIGINT := 0;
    max_steps INTEGER := 0;
    max_steps_date DATE := NULL;
    
    last_date DATE := NULL;
BEGIN
    -- Iterate through all verified submissions for the user, ordered by date
    -- We assume one submission per day per league. If multiple leagues, we gather distinct days?
    -- Actually, if a user is in multiple leagues, they might have multiple submissions for the same date.
    -- We should aggregate by date first.
    
    FOR r IN 
        SELECT for_date, SUM(steps) as daily_steps
        FROM submissions
        WHERE user_id = target_user_id
        -- AND verified = true -- Optional: only count verified? For now count all or verified?
        -- Let's count all for "Personal Best" but maybe only verified for "Official Records"?
        -- User request said "unverified" allows bulk upload. Let's include everything for now, or maybe exclude Flagged.
        GROUP BY for_date
        ORDER BY for_date ASC
    LOOP
        -- Total Steps
        total_steps := total_steps + r.daily_steps;
        
        -- Best Day
        IF r.daily_steps > max_steps THEN
            max_steps := r.daily_steps;
            max_steps_date := r.for_date;
        END IF;

        -- Streak Logic
        IF prev_date IS NULL THEN
            curr_streak := 1;
        ELSIF r.for_date = prev_date + 1 THEN
            curr_streak := curr_streak + 1;
        ELSIF r.for_date > prev_date + 1 THEN
             -- Gap found, reset streak
             curr_streak := 1;
        END IF;
        -- If r.for_date == prev_date, it's the same day (should be handled by GROUP BY), strictly it won't happen.
        
        -- Update Max Streak
        IF curr_streak > max_streak THEN
            max_streak := curr_streak;
        END IF;
        
        prev_date := r.for_date;
        last_date := r.for_date;
    END LOOP;
    
    -- Insert or Update user_records
    INSERT INTO user_records (
        user_id, 
        best_day_steps, 
        best_day_date, 
        current_streak, 
        longest_streak, 
        total_steps_lifetime, 
        last_activity_date,
        updated_at
    )
    VALUES (
        target_user_id,
        max_steps,
        max_steps_date,
        CASE WHEN last_date >= CURRENT_DATE - 1 THEN curr_streak ELSE 0 END,
        max_streak,
        total_steps,
        last_date,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        best_day_steps = EXCLUDED.best_day_steps,
        best_day_date = EXCLUDED.best_day_date,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        total_steps_lifetime = EXCLUDED.total_steps_lifetime,
        last_activity_date = EXCLUDED.last_activity_date,
        updated_at = NOW();
        
END;
$$ LANGUAGE plpgsql;

-- Trigger Function
CREATE OR REPLACE FUNCTION trigger_update_user_records()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM recalculate_user_records(OLD.user_id);
    ELSE
        PERFORM recalculate_user_records(NEW.user_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS on_submission_update_stats ON submissions;
CREATE TRIGGER on_submission_update_stats
AFTER INSERT OR UPDATE OR DELETE ON submissions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_user_records();
