-- Make league_id nullable in submissions table to support global/league-agnostic steps
ALTER TABLE public.submissions ALTER COLUMN league_id DROP NOT NULL;
