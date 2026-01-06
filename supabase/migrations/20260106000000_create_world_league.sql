-- StepLeague World: A global league that any user can join
-- Uses a fixed UUID for easy reference but behaves like any other league

INSERT INTO leagues (
  id,
  name,
  description,
  owner_id,
  is_public,
  max_members,
  category,
  invite_code,
  stepweek_start,
  require_verification_photo,
  allow_manual_entry
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'StepLeague World',
  'The global arena where all StepLeague users compete. Join to see how you rank worldwide!',
  (SELECT id FROM auth.users LIMIT 1), -- Use first user as owner (system)
  true,
  999999999, -- Unlimited members
  'world',
  'WORLD', -- Easy-to-remember invite code
  'Monday',
  false,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;
