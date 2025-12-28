-- STEP 1: Run this query to find the exact IDs of the features you want to close.
SELECT id, subject, board_status, created_at
FROM feedback
WHERE
  board_status != 'done'
  AND (
    subject ILIKE '%Admin Feedback%'
    OR subject ILIKE '%Feedback Page%'
    OR subject ILIKE '%Homepage%'
    OR subject ILIKE '%Menu%'
    OR subject ILIKE '%Badge%'
    OR subject ILIKE '%League%'
  )
ORDER BY created_at DESC;

-- OPTION 1: Update by specific PRD Titles (Try this first)
UPDATE feedback
SET
  board_status = 'done',
  completed_at = NOW()
WHERE
  board_status != 'done'
  AND subject IN (
    'Admin Feedback Page Polish',
    'Homepage Swap Implementation',
    'Implement Menu Locations System',
    'Centralize Badge Color System',
    'League-Specific Step Counting Start',
    'Reordering Feedback PRDs',
    'Unifying Filter Components'
  );

-- OPTION 2: Update by ID (If the titles above don't match exactly)
-- Copy the IDs from your query result and paste them below.
/*
UPDATE feedback
SET
  board_status = 'done',
  completed_at = NOW()
WHERE id IN (
  'paste-uuid-1-here',
  'paste-uuid-2-here'
);
*/

-- VERIFICATION: Check what was marked as done
SELECT id, subject, board_status, completed_at
FROM feedback
WHERE board_status = 'done' AND completed_at > NOW() - INTERVAL '1 hour'
ORDER BY completed_at DESC;
