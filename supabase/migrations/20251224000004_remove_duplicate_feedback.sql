-- Migration: Remove duplicate feedback entries
-- Date: 2025-12-24
-- Purpose: Clean up duplicates caused by running seed script multiple times

-- Step 1: Delete duplicate entries keeping the one with lower priority_order (original seed)
-- This uses a CTE to identify duplicates and keeps only the first occurrence

WITH duplicates AS (
  SELECT id,
         subject,
         priority_order,
         ROW_NUMBER() OVER (PARTITION BY subject, is_public ORDER BY priority_order ASC, created_at ASC) as rn
  FROM feedback
  WHERE is_public = true
)
DELETE FROM feedback
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Also delete entries from the old seed run with priority_order >= 200
-- These are clearly from a second seed (seed_roadmap.sql vs seed_roadmap_complete.sql)
DELETE FROM feedback 
WHERE is_public = true 
  AND priority_order >= 200;

-- Step 3: Add unique constraint to prevent future duplicates
-- Only for public roadmap items (subject + is_public combination)
ALTER TABLE feedback 
ADD CONSTRAINT unique_public_feedback_subject 
UNIQUE (subject) 
WHERE is_public = true;

-- Step 4: Verify cleanup
-- SELECT board_status, target_release, COUNT(*) 
-- FROM feedback 
-- WHERE is_public = true 
-- GROUP BY board_status, target_release 
-- ORDER BY target_release, board_status;
