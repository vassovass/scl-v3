-- Create high_fives table
create table if not exists high_fives (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid references submissions(id) on delete cascade,
  league_id uuid references leagues(id) on delete cascade,
  created_at timestamptz default now(),
  
  -- One high-five per sender per submission (or per user if submission_id is null)
  unique nulls not distinct (sender_id, submission_id, recipient_id)
);

-- Enable RLS
alter table high_fives enable row level security;

-- Policies
create policy "Users can view high fives in their leagues"
  on high_fives for select
  using (
    exists (
      select 1 from memberships
      where user_id = auth.uid()
      and league_id = high_fives.league_id
    )
  );

create policy "Users can create high fives"
  on high_fives for insert
  with check (
    auth.uid() = sender_id
  );

create policy "Users can delete their own high fives"
  on high_fives for delete
  using (
    auth.uid() = sender_id
  );

-- Add feature flag setting if it doesn't exist
insert into app_settings (key, value, label, description, category, value_type, visible_to, show_in_league_settings)
values (
  'feature_high_fives',
  '{"enabled": true}',
  'High-Fives Feature',
  'Enable peer encouragement and mindfulness features',
  'features',
  'boolean',
  '{superadmin}',
  false
)
on conflict (key) do nothing;
