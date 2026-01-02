ALTER TABLE leagues DROP CONSTRAINT IF EXISTS leagues_stepweek_start_check;

ALTER TABLE leagues ADD CONSTRAINT leagues_stepweek_start_check 
CHECK (stepweek_start IN ('monday', 'sunday', 'mon', 'sun', 'Monday', 'Sunday'));
